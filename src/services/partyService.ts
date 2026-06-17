import { supabaseServer } from '@/lib/supabase-admin';
import { JOB_CLASS_JP } from '@/lib/jobClass';

export class PartyService {
    static async getEnrichedPartyMembers(ownerId: string): Promise<any[]> {
        // RLSバイパスでパーティメンバーを取得（adminクライアント使用）
        const { data, error } = await supabaseServer
            .from('party_members')
            .select('*')
            .eq('owner_id', ownerId)
            .eq('is_active', true);

        if (error) {
            console.error('Party list error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            return [];
        }

        // NPCマスタから職種・レベル・ステータスを取得
        // 【優先①】slug で結合（新規雇用済み）
        const memberSlugs = data.map((m: any) => m.slug).filter(Boolean);
        // 【フォールバック②】slug=NULL のメンバーは name で検索
        const membersWithoutSlug = data.filter((m: any) => !m.slug);
        const memberNames = membersWithoutSlug.map((m: any) => m.name).filter(Boolean);

        const npcMap = new Map<string, any>();

        // slug で検索
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
        return data.map((member: any) => {
            const npc = member.slug
                ? npcMap.get(`slug:${member.slug}`)
                : npcMap.get(`name:${member.name}`);

            const skillNames: string[] = [];
            if (member.inject_cards && Array.isArray(member.inject_cards)) {
                for (const id of member.inject_cards) {
                    const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                    skillNames.push(cardNameMap[numId] || `#${numId}`);
                }
            }

            const jobClassEn = npc?.job_class || npc?.job || member.job_class || 'Adventurer';
            const jobClassJp = JOB_CLASS_JP[jobClassEn] || jobClassEn;

            const slug = member.slug || npc?.slug;
            const resolvedImageUrl = member.image_url
                || npc?.image_url
                || (slug ? `/images/npcs/${slug}.png` : null);

            const rawMaxDur = member.max_durability;
            const npcHp = npc?.max_hp ?? null;
            const resolvedMaxHp = (rawMaxDur && rawMaxDur !== 100)
                ? rawMaxDur
                : (npcHp ?? rawMaxDur ?? 100);
            const currentDurability = member.durability ?? resolvedMaxHp;

            return {
                ...member,
                slug: slug || member.slug,
                epithet: npc?.epithet || member.epithet || '',
                job_class: jobClassJp,
                level: (member.origin_type === 'shadow_active' || member.origin_type === 'shadow_heroic')
                    ? (member.level ?? npc?.level ?? null)
                    : (npc?.level ?? member.level ?? null),
                hp: currentDurability,
                max_hp: resolvedMaxHp,
                durability: currentDurability,
                max_durability: resolvedMaxHp,
                atk: (member.origin_type === 'shadow_active' || member.origin_type === 'shadow_heroic')
                    ? (member.atk ?? npc?.attack ?? npc?.atk ?? null)
                    : (npc?.attack ?? npc?.atk ?? member.atk ?? null),
                def: (member.origin_type === 'shadow_active' || member.origin_type === 'shadow_heroic')
                    ? (member.def ?? npc?.defense ?? npc?.def ?? null)
                    : (npc?.defense ?? npc?.def ?? member.def ?? null),
                image_url: resolvedImageUrl,
                icon_url: resolvedImageUrl,
                skill_names: skillNames,
                flavor_text: npc?.introduction || npc?.flavor_text || member.introduction || member.flavor_text || undefined,
                vitality: member.vitality ?? 100,
            };
        });
    }
}
