import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-admin';

// JWT認証ヘルパー (x-user-id fallback removed v27)
async function getAuthUserId(req: Request): Promise<string | null> {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) return user.id;
    }
    return null;
}

// [Security v27.3] ストーリー・スポット報酬など、ドロップ以外で直接付与してはいけないアイテムのプレフィックス
const RESTRICTED_SLUG_PREFIXES = ['story_', 'spot_', 'item_pass_'];
// クエスト専用アイテム（grant API経由でのみ付与可能）
const QUEST_ONLY_SLUGS = new Set([
    'item_debris_clear', 'item_royal_decree', 'item_launder_scroll',
]);

// POST: Add Item to Inventory (ドロップ / バトル報酬用)
export async function POST(req: Request) {
    try {
        const { item_slug, quantity = 1, source } = await req.json();
        
        const userId = await getAuthUserId(req);

        if (!userId) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // [Security v27.3] ソースコンテキスト検証
        if (!source || !['battle_drop', 'quest_reward', 'system'].includes(source)) {
            console.warn(`[Inventory POST] Rejected: missing/invalid source='${source}' for slug='${item_slug}' user=${userId}`);
            return NextResponse.json({ error: 'Invalid source context' }, { status: 400 });
        }

        // [Security v27.3] 制限付きアイテムのドロップ経由での追加を防止
        if (source === 'battle_drop') {
            if (RESTRICTED_SLUG_PREFIXES.some(prefix => item_slug?.startsWith(prefix))) {
                console.warn(`[Inventory POST] Blocked restricted item via drop: slug='${item_slug}' user=${userId}`);
                return NextResponse.json({ error: 'This item cannot be obtained via drops' }, { status: 403 });
            }
            if (QUEST_ONLY_SLUGS.has(item_slug)) {
                console.warn(`[Inventory POST] Blocked quest-only item via drop: slug='${item_slug}' user=${userId}`);
                return NextResponse.json({ error: 'This item cannot be obtained via drops' }, { status: 403 });
            }
        }

        // [Security v27.3] 数量上限（1回のリクエストで最大5個まで）
        const safeQuantity = Math.max(1, Math.min(5, Math.floor(quantity)));

        // 1. Get Item ID
        const { data: item, error: itemError } = await supabase
            .from('items')
            .select('id, name, type')
            .eq('slug', item_slug)
            .single();

        if (itemError || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // [Security v27.3] type='skill' のアイテムはこのパスで追加不可（user_skills経由で管理）
        if (item.type === 'skill') {
            return NextResponse.json({ error: 'Skill items must be acquired via shop or quest reward' }, { status: 400 });
        }

        // 2. Check if already exists in inventory (stackable?)
        const { data: existing } = await supabaseServer
            .from('inventory')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('item_id', item.id)
            .maybeSingle();

        if (existing) {
            // 爆薬(ID: 3010 / item_explosive)の複数所持制限: すでに持っているなら追加をスキップ
            if (item.id === 3010) {
                console.log(`[Inventory POST] Skip adding item_explosive as user ${userId} already owns it.`);
                return NextResponse.json({ success: true, item_name: item.name, skipped: true });
            }
            const { error } = await supabaseServer
                .from('inventory')
                .update({ quantity: existing.quantity + safeQuantity })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            // 爆薬の新規追加の場合は数量を強制的に 1 に制限
            const finalQuantity = item.id === 3010 ? 1 : safeQuantity;
            const { error } = await supabaseServer
                .from('inventory')
                .insert({
                    user_id: userId,
                    item_id: item.id,
                    quantity: finalQuantity,
                    is_equipped: false,
                    is_skill: false,
                    acquired_at: new Date().toISOString()
                });

            if (error) {
                console.error("Inventory Insert Error:", error);
                throw error;
            }
        }

        return NextResponse.json({ success: true, item_name: item.name });
    } catch (err: any) {
        console.error("Inventory Add Error:", err);
        return NextResponse.json({ error: err.message, details: JSON.stringify(err) }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        // supabaseServer (Service Role) でRLSをバイパスし、確実にデータを取得する

        const userId = await getAuthUserId(req);

        let query = supabaseServer
            .from('inventory')
            .select(`
                id,
                is_equipped,
                acquired_at,
                quantity,
                is_skill,
                items!inner (
                    id,
                    name,
                    slug,
                    type,
                    sub_type,
                    base_price,
                    effect_data,
                    cost
                )
            `);

        // If userId is provided, filter by it. Else, maybe return system items or empty?
        if (userId) {
            query = query.eq('user_id', userId);
        } else {
            // Fallback: Return empty or demo?
            query = query.is('user_id', null);
        }

        // user_skills も並列取得
        const [inventoryResult, userSkillsResult] = await Promise.all([
            query,
            userId ? supabaseServer
                .from('user_skills')
                .select(`
                    id,
                    skill_id,
                    is_equipped,
                    created_at,
                    skills!inner (
                        id,
                        slug,
                        name,
                        card_id,
                        base_price,
                        deck_cost,
                        image_url,
                        description,
                        cards (
                            id,
                            slug,
                            name,
                            type,
                            cost_type,
                            cost_val,
                            effect_val,
                            ap_cost,
                            target_type,
                            effect_id,
                            image_url,
                            description
                        )
                    )
                `)
                .eq('user_id', userId) : Promise.resolve({ data: [], error: null })
        ]);

        const { data, error } = inventoryResult;

        if (error) {
            console.error("Inventory GET Supabase Error:", JSON.stringify(error, null, 2));
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        // user_skills のエラーログ（サイレント失敗防止）
        if (userSkillsResult.error) {
            console.error("user_skills GET Error:", JSON.stringify(userSkillsResult.error, null, 2));
        }

        // --- Items (non-skill) ---
        const itemInventory = (data || []).map((entry: any) => {
            try {
                if (!entry.items) {
                    console.warn(`Inventory Item Orphan Detected! ID: ${entry.id}`);
                    return null;
                }
                const item = entry.items;
                const effectData = item.effect_data || {};
                const powerVal = effectData.heal || effectData.damage || effectData.power || 0;

                // v5.3: items.type === 'skill' はレガシーデータ（旧仕様で inventory に入ったスキル）
                // → is_skill: true, item_type: 'skill_card' としてデッキタブに表示させる
                // ただし slug ベースでスキル教本系のプレフィックスを持つもののみに限定
                // (交易品・装備品等が万が一 type='skill' のまま残っていても誤分類を防ぐ)
                const SKILL_SLUG_PREFIXES = ['book_', 'grimoire_', 'scroll_', 'skill_', 'manual_'];
                const hasSkillSlug = item.slug && SKILL_SLUG_PREFIXES.some((p: string) => item.slug.startsWith(p));
                const isLegacySkill = item.type === 'skill' && hasSkillSlug;

                return {
                    id: entry.id,
                    item_id: item.id,
                    name: item.name,
                    slug: item.slug || null,
                    description: effectData.description || item.name,
                    item_type: isLegacySkill ? 'skill_card' : item.type,
                    sub_type: item.sub_type || null,
                    power_value: powerVal,
                    required_attribute: 'None',
                    base_price: item.base_price || 0,
                    is_equipped: entry.is_equipped,
                    acquired_at: entry.acquired_at,
                    quantity: entry.quantity,
                    is_skill: isLegacySkill,
                    cost: item.cost || effectData.cost_val || effectData.cost || 0,
                    effect_data: effectData,
                    image_url: item.slug ? `/images/items/${item.slug}.png` : null
                };
            } catch (e: any) {
                console.error(`Error mapping inventory item ${entry.id}:`, e);
                return null;
            }
        }).filter(Boolean) as any[];

        // 同一アイテムを item_id で集約
        const aggregatedItems: any[] = [];
        const itemMap = new Map<string, any>();
        for (const inv of itemInventory) {
            const key = String(inv.item_id);
            if (itemMap.has(key)) {
                itemMap.get(key).quantity += (inv.quantity || 1);
            } else {
                const merged = { ...inv, quantity: inv.quantity || 1 };
                itemMap.set(key, merged);
                aggregatedItems.push(merged);
            }
        }

        // --- Skills (from user_skills) ---
        const skillInventory = (userSkillsResult.data || []).map((entry: any) => {
            try {
                const skill = entry.skills;
                if (!skill) return null;
                const card = skill.cards;
                const effectData = card ? {
                    cost_val: card.cost_val, // v28: DB伝搬のみ。バトルでのVIT/MP消費には不使用。
                    effect_val: card.effect_val,
                    cost_type: card.cost_type, // v28: 'item'のみ有効（1バトル1回制限）。vitality/mpは廃止。
                    card_type: card.type,
                    ap_cost: card.ap_cost ?? 1,
                    target_type: card.target_type,
                    effect_id: card.effect_id || null,
                    image_url: card.image_url || null,      // v3.3: バトルカード画像
                    // v3.3: skills.description → cards.description → skill.name の順で優先
                    description: skill.description || card.description || card.name
                } : {};

                return {
                    id: entry.id,
                    item_id: skill.id,
                    skill_id: skill.id,
                    card_id: skill.card_id,
                    name: skill.name,
                    slug: skill.slug || null,
                    // [SK6 v27.3] cards.description を最優先（効果テキストが詳細）
                    description: card?.description || skill.description || skill.name,
                    item_type: 'skill_card',
                    power_value: card?.effect_val || 0,
                    base_price: skill.base_price || 0,
                    is_equipped: entry.is_equipped,
                    acquired_at: entry.created_at,
                    quantity: 1,
                    is_skill: true,
                    cost: skill.deck_cost || 0,
                    effect_data: effectData,
                    image_url: card?.image_url || skill.image_url || (skill.slug ? `/images/items/${skill.slug}.png` : null)
                };
            } catch (e: any) {
                console.error(`Error mapping user_skill ${entry.id}:`, e);
                return null;
            }
        }).filter(Boolean) as any[];

        return NextResponse.json({ inventory: [...aggregatedItems, ...skillInventory] });
    } catch (err: any) {
        console.error("Inventory GET Critical Error:", err);
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
    }
}

// PATCH: Equip/Unequip (v5.2: inventory + user_skills 両対応, レガシースキルフォールバック付き)
export async function PATCH(req: Request) {
    try {
        const { inventory_id, is_equipped, bypass_lock, is_skill } = await req.json();
        
        // JWT認証 (v27: x-user-id fallback removed)
        const userId = await getAuthUserId(req);

        // is_skill が true の場合、まず user_skills に該当IDがあるか確認
        // なければレガシースキル（inventory テーブルに保存された旧スキル）とみなす
        let isLegacySkill = false;
        if (is_skill) {
            const { data: skillRecord } = await supabaseServer
                .from('user_skills')
                .select('id')
                .eq('id', inventory_id)
                .maybeSingle();

            if (!skillRecord) {
                // user_skills に該当IDが存在しない → レガシースキル（inventory テーブル側）
                isLegacySkill = true;
                console.log(`[PATCH] Legacy skill detected: inventory_id=${inventory_id} not found in user_skills, falling back to inventory table`);
            }
        }

        // 実際に更新するテーブルを決定
        const useUserSkillsTable = is_skill && !isLegacySkill;

        // クエスト進行中の装備変更制限 (is_equipped: true にする場合のみ、bypass_lockがない場合)
        if (is_equipped && userId && !bypass_lock) {
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('current_quest_id, quest_started_at')
                .eq('id', userId)
                .single();

            if (profile?.current_quest_id && profile.quest_started_at) {
                // 実際に使用するテーブルから取得日時を確認
                const tableName = useUserSkillsTable ? 'user_skills' : 'inventory';
                const { data: invItem } = await supabaseServer
                    .from(tableName)
                    .select('acquired_at')
                    .eq('id', inventory_id)
                    .single();

                if (invItem && invItem.acquired_at) {
                    const questStarted = new Date(profile.quest_started_at).getTime();
                    const itemAcquired = new Date(invItem.acquired_at).getTime();

                    if (itemAcquired < questStarted) {
                        return NextResponse.json(
                            { error: 'クエスト進行中は、事前所持アイテムを新たに装備できません。' },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        // [SK1 v27.3] デッキコスト上限のサーバーサイド検証（スキル装備時のみ）
        if (is_equipped && is_skill && userId) {
            const { data: profile } = await supabaseServer
                .from('user_profiles')
                .select('max_deck_cost')
                .eq('id', userId)
                .single();

            const maxDeckCost = profile?.max_deck_cost || 10;

            // 現在装備中のスキルのdeck_costを合算
            const [{ data: equippedUserSkills }, { data: equippedLegacySkills }] = await Promise.all([
                supabaseServer
                    .from('user_skills')
                    .select('id, skills!inner(deck_cost)')
                    .eq('user_id', userId)
                    .eq('is_equipped', true),
                supabaseServer
                    .from('inventory')
                    .select('id, items!inner(type, effect_data)')
                    .eq('user_id', userId)
                    .eq('is_equipped', true)
                    .eq('is_skill', true),
            ]);

            let currentDeckCost = 0;
            for (const s of (equippedUserSkills || [])) {
                if (String(s.id) === String(inventory_id)) continue; // 自身は除外
                currentDeckCost += (s as any).skills?.deck_cost || 0;
            }
            for (const s of (equippedLegacySkills || [])) {
                if (String(s.id) === String(inventory_id)) continue;
                const ed = (s as any).items?.effect_data;
                currentDeckCost += ed?.deck_cost || ed?.cost || 0;
            }

            // 新たに装備するスキルのdeck_costを取得
            let newSkillCost = 0;
            if (useUserSkillsTable) {
                const { data: skillData } = await supabaseServer
                    .from('user_skills')
                    .select('skills!inner(deck_cost)')
                    .eq('id', inventory_id)
                    .single();
                newSkillCost = (skillData as any)?.skills?.deck_cost || 0;
            } else {
                const { data: invData } = await supabaseServer
                    .from('inventory')
                    .select('items!inner(effect_data)')
                    .eq('id', inventory_id)
                    .single();
                const ed = (invData as any)?.items?.effect_data;
                newSkillCost = ed?.deck_cost || ed?.cost || 0;
            }

            if (currentDeckCost + newSkillCost > maxDeckCost) {
                return NextResponse.json(
                    { error: `デッキコスト上限を超えています。(${currentDeckCost + newSkillCost}/${maxDeckCost})` },
                    { status: 400 }
                );
            }
        }

        // v5.2: スキルとアイテムでテーブルを分岐（レガシースキルは inventory にフォールバック）
        if (useUserSkillsTable) {
            // user_skills テーブルを更新（正規スキル）
            let query = supabaseServer
                .from('user_skills')
                .update({ is_equipped })
                .eq('id', inventory_id);

            if (userId) query = query.eq('user_id', userId);

            const { error } = await query;
            if (error) throw error;
        } else {
            // inventory テーブルを更新（通常アイテム or レガシースキル）
            let query = supabaseServer
                .from('inventory')
                .update({ is_equipped })
                .eq('id', inventory_id);

            if (userId) {
                query = query.eq('user_id', userId);
            } else {
                query = query.is('user_id', null);
            }

            const { error } = await query;
            if (error) throw error;

            if (isLegacySkill) {
                console.log(`[PATCH] Legacy skill equip updated successfully: inventory_id=${inventory_id}, is_equipped=${is_equipped}`);
            }
        }
        // v4.2.1: signature_deck 同期 — スキル装備/解除後に user_profiles.signature_deck を更新
        // 英霊作成時（死亡/引退）にこのフィールドが参照されるため、常に最新のデッキ状態を反映する
        if (is_skill && userId) {
            try {
                const { data: equippedAfter } = await supabaseServer
                    .from('user_skills')
                    .select('skills!inner(card_id)')
                    .eq('user_id', userId)
                    .eq('is_equipped', true)
                    .limit(6);

                const cardIds = (equippedAfter || [])
                    .map((e: any) => e.skills?.card_id)
                    .filter(Boolean)
                    .map(Number);

                await supabaseServer
                    .from('user_profiles')
                    .update({ signature_deck: cardIds })
                    .eq('id', userId);
            } catch (syncErr) {
                console.warn('[PATCH] signature_deck sync failed (non-fatal):', syncErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
