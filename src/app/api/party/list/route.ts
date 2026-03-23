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
        const memberNames = data.map((m: any) => m.name);
        const { data: npcs, error: npcError } = await supabaseServer
            .from('npcs')
            .select('name, job_class, level, attack, defense, max_hp')
            .in('name', memberNames);

        if (npcError) {
            console.error('NPC lookup error:', npcError.message);
        }

        const npcMap = new Map<string, any>();
        if (npcs) {
            for (const npc of npcs) {
                npcMap.set(npc.name, npc);
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
            const npc = npcMap.get(member.name);

            // inject_cards のカード名解決
            const skillNames: string[] = [];
            if (member.inject_cards && Array.isArray(member.inject_cards)) {
                for (const id of member.inject_cards) {
                    const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
                    skillNames.push(cardNameMap[numId] || `#${numId}`);
                }
            }

            const jobClassEn = npc?.job_class || 'Adventurer';
            const jobClassJp = JOB_CLASS_JP[jobClassEn] || jobClassEn;

            return {
                ...member,
                // NPCマスタからの補完データ
                job_class: jobClassJp,
                level: npc?.level ?? null,
                hp: npc?.max_hp ?? null,
                atk: npc?.attack ?? null,
                def: npc?.defense ?? null,
                // スキル名解決済み
                skill_names: skillNames,
            };
        });

        return NextResponse.json({ party: enrichedParty });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
