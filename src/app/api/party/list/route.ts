import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase-auth';
import { supabaseServer } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// 英語職種 → 日本語マッピング
const JOB_CLASS_JP: Record<string, string> = {
    Warrior: '戦士', Fighter: '格闘家', Knight: '騎士', Paladin: '聖騎士',
    Ranger: '狩人', Scout: '斥候', Archer: '弓使い', Thief: '盗賊', Rogue: '遊撃士',
    Mage: '魔法使い', Wizard: '魔術師', Sorcerer: '術師', Warlock: '呪術師',
    Cleric: '僧侶', Priest: '神官', Druid: 'ドルイド', Shaman: '呪術師',
    Bard: '吟遊詩人', Merchant: '商人', Alchemist: '錬金術師', Scholar: '学者',
    Adventurer: '冒険者', Assassin: '暗殺者', Monk: '修道士', Necromancer: '死霊術師',
    Mercenary: '傭兵', Porter: '荷運び', Animal: '動物', Guard: '衛兵',
    Hunter: '狩人', Samurai: '侍', Miko: '巫女', Ninja: '忍者',
    Dancer: '踊り子', Lancer: '槍術士', Undead: '不死者', Chef: '料理人',
    Taoist: '道士', Ghost: '幽霊', Armor: '鎧', Bandit: '山賊',
    Villager: '村人', Machine: '機械', Monster: '魔獣', Object: '物体',
    Tactician: '軍師', Gambler: '賭博師', Soldier: '兵士', Slave: '奴隷',
    Caster: '術師', Summoner: '召喚士', 'Heroic Spirit': '英霊',
};

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const owner_id = searchParams.get('owner_id');

        if (!owner_id) {
            return NextResponse.json({ error: 'Missing owner_id' }, { status: 400 });
        }

        // RLSバイパスでパーティメンバーを取得（adminクライアント使用）
        const { data, error } = await supabaseServer
            .from('party_members')
            .select('*')
            .eq('owner_id', owner_id)
            .eq('is_active', true);

        if (error) {
            console.error('Party list error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ party: [] });
        }

        // NPCマスタから職種・レベル・ステータスを取得
        // 【優先①】slug で結合（新規雇用済み）
        const memberSlugs = data.map((m: any) => m.slug).filter(Boolean);
        // 【フォールバック②】slug=NULL のメンバーは name で検索
        const membersWithoutSlug = data.filter((m: any) => !m.slug);
        const memberNames = membersWithoutSlug.map((m: any) => m.name).filter(Boolean);

        const npcMap = new Map<string, any>();

        // slug で検索  ← select('*') で未知カラムエラーを回避
        if (memberSlugs.length > 0) {
            const { data: npcsBySlug, error: npcSlugError } = await supabaseServer
                .from('npcs')
                .select('*')
                .in('slug', memberSlugs);
            if (npcSlugError) console.error('NPC slug lookup error:', npcSlugError.message);
            if (npcsBySlug) {
                for (const npc of npcsBySlug) {
                    npcMap.set(`slug:${npc.slug}`, npc);
                }
            }
        }

        // name でフォールバック検索（slug=NULLのメンバー向け: 既存レコード対応）
        if (memberNames.length > 0) {
            const { data: npcsByName, error: npcNameError } = await supabaseServer
                .from('npcs')
                .select('*')
                .in('name', memberNames);
            if (npcNameError) console.error('NPC name lookup error:', npcNameError.message);
            if (npcsByName) {
                for (const npc of npcsByName) {
                    // 名前をキーに登録（重複する場合は最初の1件）
                    if (!npcMap.has(`name:${npc.name}`)) {
                        npcMap.set(`name:${npc.name}`, npc);
                    }
                }
            }
        }

        // カードIDを名前に解決
        const allCardIds: number[] = [];
        for (const member of data) {
            if (member.inject_cards && Array.isArray(member.inject_cards)) {
                for (const id of member.inject_cards) {
                    const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                    if (!isNaN(numId) && !allCardIds.includes(numId)) allCardIds.push(numId);
                }
            }
        }

        const cardNameMap: Record<number, string> = {};
        if (allCardIds.length > 0) {
            const { data: cards } = await supabaseServer
                .from('cards')
                .select('id, name')
                .in('id', allCardIds);
            if (cards) {
                for (const card of cards) {
                    cardNameMap[card.id] = card.name;
                }
            }
        }

        // パーティメンバーにNPCデータ・カード名を結合して返す
        const enrichedParty = data.map((member: any) => {
            // slug優先、なければ name でフォールバック
            const npc = member.slug
                ? npcMap.get(`slug:${member.slug}`)
                : npcMap.get(`name:${member.name}`);

            // inject_cards のカード名解決
            const skillNames: string[] = [];
            if (member.inject_cards && Array.isArray(member.inject_cards)) {
                for (const id of member.inject_cards) {
                    const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                    skillNames.push(cardNameMap[numId] || `#${numId}`);
                }
            }

            const jobClassEn = npc?.job_class || npc?.job || member.job_class || 'Adventurer';
            const jobClassJp = JOB_CLASS_JP[jobClassEn] || jobClassEn;

            // 画像 URL: party_members.image_url → npc.image_url → slugフォールバック
            const slug = member.slug || npc?.slug;
            const resolvedImageUrl = member.image_url
                || npc?.image_url
                || (slug ? `/images/npcs/${slug}.png` : null);

            // HP 計算: 優先順位 = party_members.max_durability（hire時スナップショット）> npc.hp > npc.max_hp > 100
            // 注意: npc.max_hp は全NPC共通のデフォルト値（50等）が入りやすいため、party_membersの値を優先する
            const rawMaxDur = member.max_durability;
            const npcHp = npc?.max_hp ?? npc?.hp ?? null;
            // system_mercenary は hire時に snapshotHp(=npc.hp) を max_durability に保存済みなのでそれを最優先
            // active_shadow は hire時の user_profiles.max_hp を max_durability に保存済み
            const resolvedHp = (rawMaxDur && rawMaxDur !== 100)
                ? rawMaxDur
                : (npcHp ?? member.durability ?? 100);

            return {
                ...member,
                // NPCマスタからの補完データ（カラム名複数パターン対応）
                slug: slug || member.slug,
                epithet: npc?.epithet || member.epithet || '',
                job_class: jobClassJp,
                // v25: active_shadow は party_members のスナップショット値を優先
                level: member.origin_type === 'active_shadow'
                    ? (member.level ?? npc?.level ?? null)
                    : (npc?.level ?? member.level ?? null),
                // HP: 上記で計算した resolvedHp を使用
                hp: resolvedHp,
                max_hp: resolvedHp,
                // ATK: active_shadow は party_members.atk 優先
                atk: member.origin_type === 'active_shadow'
                    ? (member.atk ?? npc?.attack ?? npc?.atk ?? null)
                    : (npc?.attack ?? npc?.atk ?? member.atk ?? null),
                // DEF: active_shadow は party_members.def 優先
                def: member.origin_type === 'active_shadow'
                    ? (member.def ?? npc?.defense ?? npc?.def ?? null)
                    : (npc?.defense ?? npc?.def ?? member.def ?? null),
                // 画像 URL
                image_url: resolvedImageUrl,
                icon_url: resolvedImageUrl,
                // スキル名解決済み
                skill_names: skillNames,
                // flavor_text
                flavor_text: npc?.introduction || npc?.flavor_text || member.introduction || member.flavor_text || undefined,
            };
        });

        return NextResponse.json({ party: enrichedParty });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
