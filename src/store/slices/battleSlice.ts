import { supabase } from '@/lib/supabase';
import { Card, Enemy, PartyMember, InventoryItem } from '@/types/game';
import { buildBattleDeck, routeDamage, calculateDamage, calculateDamageV4, rollMiss } from '@/lib/battleEngine';
import { BATTLE_RULES } from '@/constants/battle_rules';
import { resolveNpcTurn, determineRole, determineGrade, BattleContext } from '@/lib/npcAI';
import { StatusEffect, applyEffect, removeEffect, hasEffect, tickEffects, getBleedDamage, isStunned, StatusEffectId, getEffectName, getMissChance, getAtkDownMod, getEvasionChance, getDefBonus, getDefDownMod, rollDebuffSuccess, isValidEffectId, NEGATIVE_EFFECTS, cureStatus, cureDebuff, isSelfBuffEffect, getBuffStatusLogMessages } from '@/lib/statusEffects';
import { validateCardUse, getDefaultTarget, getCardApCost } from '@/lib/targeting';
import { getCardEffectInfo } from '@/lib/cardEffects';
import { getPassiveLabel } from '@/lib/passiveEffects';
import { getEnemySkill, loadEnemySkillsFromDB } from '@/lib/enemySkills';
import { useQuestState } from '../useQuestState';
import { GROWTH_RULES } from '@/constants/game_rules';
import { soundManager, CARD_EFFECT_SE_MAP } from '@/lib/soundManager';
import { getEffectiveAtk, getEffectiveDef, getEffectiveMaxHp } from './profileSlice';
import { getAuthHeaders } from '@/lib/authToken';
import type { GameState } from '../types';

const isTurnEndTickCompensated = (id: StatusEffectId): boolean => {
    return [
        'stun', 'bind', 'freeze',                  // 行動不能デバフ
        'def_up', 'evasion_up', 'taunt',          // 敵ターン中意味を持つバフ
        'unyielding_barrier', 'cover_all',         // 敵ターン中意味を持つバフ
        'atk_down', 'blind', 'blind_minor'         // 敵ターン中意味を持つデバフ
    ].includes(id);
};

// ─── ノイズカードのフォールバック ────────────────────────────────────────────
const CARD_POOL: Card[] = [
    { id: 'card_noise', name: 'Noise', type: 'Basic', description: '心に増す雑音。使用不可。', cost: 1, power: 0 },
];

export type BattleSliceActions = Pick<
    GameState,
    | 'startBattle'
    | 'attackEnemy'
    | 'runNpcPhase'
    | 'runEnemyPhase'
    | 'advanceTurn'
    | 'endTurn'
    | 'resetBattle'
    | 'initialize'
    | 'processPartyTurn'
    | 'processEnemyTurn'
    | 'useBattleItem'
    | 'dealHand'
    | 'discardCard'
    | 'useItem'
>;

// ─── ステータス更新・生命力消費ヘルパー (認証トークン自動付与) ─────────────────
async function updateProfileStatusHelper(updates: { hp?: number; gold?: number; exp?: number; vitality?: number }, userProfileId: string | null) {
    try {
        const authHeaders = await getAuthHeaders();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...authHeaders
        };
        const body = {
            ...updates,
            profileId: userProfileId
        };
        await fetch('/api/profile/update-status', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
    } catch (e) {
        console.error('[updateProfileStatusHelper] Failed to sync status:', e);
    }
}

async function consumeVitalityHelper(amount: number, userProfileId: string | null) {
    try {
        const authHeaders = await getAuthHeaders();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...authHeaders
        };
        await fetch('/api/profile/consume-vitality', {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount, profileId: userProfileId })
        });
    } catch (e) {
        console.error('[consumeVitalityHelper] Failed to consume vitality:', e);
    }
}

export const createBattleSlice = (
    set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
    get: () => GameState
): BattleSliceActions => ({

    initialize: () => get().resetBattle(),

    resetBattle: () => {
        set(state => ({
            deck: [],
            discardPile: [],
            hand: [],
            battleState: {
                ...state.battleState,
                enemy: null,
                enemies: [],
                party: [],
                turn: 1,
                current_ap: 5,
                cardsPlayedThisTurn: 0,
                messages: [],
                isVictory: false,
                isDefeat: false,
                player_effects: [],
                enemy_effects: [],
                exhaustPile: [],
                consumedItems: [],
                droppedItems: [],
                vitDamageTakenThisTurn: false,
                battle_result: undefined,
                activeSupportBuffs: [],
            }
        }));
    },

    startBattle: async (enemiesInput: Enemy | Enemy[]) => {
        const enemies = Array.isArray(enemiesInput) ? enemiesInput : [enemiesInput];
        enemies.forEach(e => { if (!e.status_effects) e.status_effects = []; });
        const firstEnemy = enemies[0];

        console.log('[GameStore] startBattle called with:', enemies.length, 'enemies');

        // [EN3 v27.4] エネミースキルマスタをDBからプリロード（パーティ取得と並列実行）
        const enemySkillLoadPromise = loadEnemySkillsFromDB(supabase);

        let partyMembers: PartyMember[] = [];
        const { userProfile } = get();
        try {
            if (userProfile?.id) {
                const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.party) partyMembers = data.party as PartyMember[];
                }
            }
        } catch (e) { console.error('Party fetch failed', e); }

        // エネミースキルDB読み込み完了を待機（失敗しても静的マップで続行）
        await enemySkillLoadPromise;

        const questState = useQuestState.getState();
        const guest = questState.guest;
        // ゲストNPCが現在のクエストに紐づいている場合のみ参加
        // (注: isInQuestの厳格チェックは行わず、ゲストが存在すればパーティに加える)
        if (guest) {
            console.log('Guest joining battle:', guest.name);
            partyMembers.push({ ...guest, is_active: true });
        }

        let resonanceActive = false;
        const locationId = userProfile?.current_location_id;
        if (locationId) {
            try {
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
                const { count } = await supabase
                    .from('user_profiles')
                    .select('id', { count: 'exact', head: true })
                    .eq('current_location_id', locationId)
                    .eq('is_alive', true)
                    .neq('id', userProfile!.id)
                    .gt('updated_at', oneHourAgo);
                if ((count ?? 0) > 0) {
                    resonanceActive = true;
                    console.log('[startBattle] 共鳳ボーナス発動！同拠点プレイヤー:', count, '人');
                }
            } catch (e) { console.warn('[startBattle] 共鳳チェック失敗（続行）', e); }
        }

        await get().fetchInventory().catch(e => console.warn('[startBattle] fetchInventory 失敗（続行）', e));
        const { inventory, worldState } = get();

        const equippedCards = (inventory || [])
            .filter(i => i.is_equipped && (i.is_skill || i.item_type === 'skill_card'))
            .map(i => ({
                id: String(i.card_id || i.id),
                name: i.name,
                type: (i.effect_data?.type || i.effect_data?.card_type || 'Skill') as Card['type'],
                description: i.effect_data?.description || '',
                cost: 0,
                power: i.effect_data?.power || i.effect_data?.effect_val || 0,
                ap_cost: i.effect_data?.ap_cost ?? 1,
                effect_id: i.effect_data?.effect_id || undefined,
                effect_duration: i.effect_data?.effect_duration || undefined,
                target_type: i.effect_data?.target_type || undefined,
                image_url: i.effect_data?.image_url || i.image_url || undefined,
                isEquipment: true,
            }));

        const neededCardIds = new Set<string>();
        partyMembers.forEach(p => { p.inject_cards?.forEach(id => neededCardIds.add(String(id))); });

        const BASIC_CARD_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        if (worldState?.status === 'Zenith' || worldState?.status === '絶頂') {
            BASIC_CARD_IDS.push('61');
        }
        const allNeededIds = new Set([...Array.from(neededCardIds), ...BASIC_CARD_IDS]);

        let partyCardPool: Card[] = [];
        const { data: dbCards } = await supabase
            .from('cards')
            .select('*')
            .in('id', Array.from(allNeededIds));

        if (dbCards) {
            partyCardPool = dbCards.map(c => ({
                id: String(c.id),
                slug: c.slug,
                name: c.name,
                type: c.type,
                description: c.description || '',
                cost: 0, // v28: 旧cost_val(VIT/MP)は廃止。APコストのみ有効。
                power: c.effect_val || c.power || 0,
                ap_cost: c.ap_cost ?? 1,
                cost_type: c.cost_type || undefined,
                effect_id: c.effect_id || undefined,
                effect_duration: c.effect_duration || undefined,
                target_type: c.target_type || undefined,
                animation_type: c.animation_type || undefined,
                image_url: c.image_url || undefined,
            })) as Card[];
        }

        // 前回バトルのパーティHP状態を取得（連戦時のHP引き継ぎ用）
        const prevParty = get().battleState?.party || [];
        const prevPartyHpMap: Record<string, number> = {};
        prevParty.forEach((pm: any) => {
            prevPartyHpMap[String(pm.id)] = pm.durability ?? pm.hp ?? 0;
        });

        const npcStartBuffMessages: string[] = [];

        partyMembers = partyMembers.map(pm => {
            const sigDeck = (pm.inject_cards || []).map(id => {
                const found = partyCardPool.find(c => c.id === String(id));
                if (found) return found;
                return CARD_POOL.find(c => c.id === String(id));
            }).filter(Boolean) as Card[];

            const pmAny = pm as any;
            const fullHp = pm.max_durability || pmAny.max_hp || pmAny.hp || pm.durability || 100;
            // 連戦時: 前のバトルのHPを引き継ぐ（存在する場合）
            let carriedHp = prevPartyHpMap[String(pm.id)];
            if (carriedHp === undefined && questState.partyHp) {
                carriedHp = questState.partyHp[String(pm.id)];
            }
            let currentHp = carriedHp !== undefined ? Math.max(0, carriedHp) : fullHp;

            let initialEffects: StatusEffect[] = [];
            let initialAp = 5;

            const snapshot = pmAny.snapshot_data;
            if (snapshot) {
                // 1. 装備品の戦闘開始バフの適用
                if (snapshot.battle_start_buffs && Array.isArray(snapshot.battle_start_buffs)) {
                    snapshot.battle_start_buffs.forEach((buff: any) => {
                        const id = buff.buff_type || buff.id;
                        const duration = buff.duration;
                        const val = buff.value;
                        if (id && duration) {
                            const finalDuration = isTurnEndTickCompensated(id as StatusEffectId)
                                ? duration + 1
                                : duration;
                            initialEffects = applyEffect(initialEffects, id as StatusEffectId, finalDuration, val);
                            const buffName = getEffectName(id as StatusEffectId, val);
                            npcStartBuffMessages.push(`✨ ${pm.name}は装備効果で${buffName}！ (${duration}T)`);
                        }
                    });
                }
                // 2. 祈りバフの適用
                if (snapshot.blessing_data) {
                    const blessing = snapshot.blessing_data;
                    initialAp += (blessing.ap_bonus || 0);
                    if (blessing.hp_pct && blessing.hp_pct > 0) {
                        const healAmt = Math.floor(fullHp * blessing.hp_pct);
                        const oldHp = currentHp;
                        currentHp = Math.min(fullHp, currentHp + healAmt);
                        const actualHeal = currentHp - oldHp;
                        if (actualHeal > 0) {
                            npcStartBuffMessages.push(`✨ ${pm.name}に祈りの加護が発動！(HP+${actualHeal}回復)`);
                        } else {
                            npcStartBuffMessages.push(`✨ ${pm.name}に祈りの加護が発動！`);
                        }
                    } else if (blessing.ap_bonus) {
                        npcStartBuffMessages.push(`✨ ${pm.name}に祈りの加護が発動！(初期AP+${blessing.ap_bonus})`);
                    }
                }
            }

            return {
                ...pm,
                durability: currentHp,
                max_durability: fullHp,
                signature_deck: sigDeck,
                ai_role: determineRole({ ...pm, signature_deck: sigDeck }),
                ai_grade: determineGrade(pm),
                current_ap: initialAp,
                status_effects: initialEffects,
                used_this_turn: [],
            };
        });

        const { deck: initialDeck, didProtectFromNoise } = buildBattleDeck(
            equippedCards,
            partyMembers,
            (id) => {
                const fromPool = partyCardPool.find(c => c.id === String(id) || c.slug === id);
                if (fromPool) return fromPool;
                return CARD_POOL.find(c => c.id === String(id) || c.slug === id);
            },
            worldState?.status,
            userProfile?.level || 1
        );

        const shuffledDeck = initialDeck.sort(() => 0.5 - Math.random());

        const { equipBonus } = get();
        console.log('[startBattle] equipBonus from store:', equipBonus);

        let initialAp = 5;
        let blessingActive = false;
        let blessingHealAmount = 0;
        if (userProfile?.blessing_data) {
            const blessing = userProfile.blessing_data as any;
            blessingActive = true;
            initialAp += (blessing.ap_bonus || 0);
            // hp_pct: 最大HPの指定%分を回復
            if (blessing.hp_pct && blessing.hp_pct > 0) {
                const maxHp = getEffectiveMaxHp(userProfile, get());
                blessingHealAmount = Math.floor(maxHp * blessing.hp_pct);
                const currentHp = userProfile.hp || 0;
                const newHp = Math.min(maxHp, currentHp + blessingHealAmount);
                blessingHealAmount = newHp - currentHp; // 実際の回復量
                if (blessingHealAmount > 0) {
                    set(state => ({
                        userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                    }));
                    // DB同期（非同期・失敗許容）
                    updateProfileStatusHelper({ hp: newHp }, userProfile.id);
                }
            }
        }

        // 装備品の戦闘開始時パッシブバフを適用
        const equippedGears = (inventory || [])
            .filter(i => i.is_equipped && (i.item_type === 'equipment' || (i as any).type === 'equipment'));

        const startBuffMessages: string[] = [];
        let initialPlayerEffects: StatusEffect[] = [];

        equippedGears.forEach(gear => {
            const ed = gear.effect_data;
            if (ed && ed.battle_start_buff) {
                const buffs = Array.isArray(ed.battle_start_buff) 
                    ? ed.battle_start_buff 
                    : [ed.battle_start_buff];

                buffs.forEach((buff: any) => {
                    const id = buff.buff_type || buff.id;
                    const duration = buff.duration;
                    const val = buff.value;
                    if (id && duration) {
                        const finalDuration = isTurnEndTickCompensated(id as StatusEffectId)
                            ? duration + 1
                            : duration;

                        initialPlayerEffects = applyEffect(
                            initialPlayerEffects,
                            id as StatusEffectId,
                            finalDuration,
                            val
                        );
                        const buffName = getEffectName(id as StatusEffectId, val);
                        startBuffMessages.push(
                            `✨ ${gear.name}の効果で${buffName}！ (${duration}T)`
                        );
                    }
                });
            }
        });

        const hasEquipBonus = equipBonus.atk > 0 || equipBonus.def > 0 || equipBonus.hp > 0;
        const equipBonusMessages: string[] = [];
        if (hasEquipBonus) {
            const parts: string[] = [];
            if (equipBonus.atk > 0) parts.push(`ATK+${equipBonus.atk}`);
            if (equipBonus.def > 0) parts.push(`DEF+${equipBonus.def}`);
            if (equipBonus.hp > 0) parts.push(`HP+${equipBonus.hp}`);
            equipBonusMessages.push(`⚔️ 装備品ボーナス適用！ (${parts.join(' / ')})`);
        }

        // v4.1 案B: 装備枚数ボーナス
        const equippedCount = equippedCards.length;
        let equipCountBonusAp = 0;
        let equipCountBonusHand = 0;
        if (equippedCount >= 10) { equipCountBonusAp = 2; equipCountBonusHand = 1; }
        else if (equippedCount >= 8) { equipCountBonusAp = 1; equipCountBonusHand = 1; }
        else if (equippedCount >= 6) { equipCountBonusAp = 1; }
        initialAp += equipCountBonusAp;
        if (equipCountBonusAp > 0 || equipCountBonusHand > 0) {
            const bonusParts: string[] = [];
            if (equipCountBonusAp > 0) bonusParts.push(`AP+${equipCountBonusAp}`);
            if (equipCountBonusHand > 0) bonusParts.push(`初期手札+${equipCountBonusHand}`);
            equipBonusMessages.push(`📦 デッキ充実ボーナス！ ${equippedCount}枚装備 → ${bonusParts.join(' / ')}`);
        }

        const blessingMsg = blessingActive
            ? (blessingHealAmount > 0
                ? `✨ 祈りの加護が発動！(AP+1 & HP+${blessingHealAmount}回復)`
                : `✨ 祈りの加護が発動！(AP+1)`)
            : null;

        const startMessages = [
            `${enemies.map(e => e.name).join('と')}が現れた！`,
            ...equipBonusMessages,
            ...startBuffMessages,
            ...npcStartBuffMessages,
            ...(resonanceActive ? ['⚡ 共鳳ボーナス発動！ ATK/DEF +10%（同拠点プレイヤー在駐）'] : []),
            ...(blessingMsg ? [blessingMsg] : []),
            ...(didProtectFromNoise ? ['✨ 世界の意志の加護により、危険地帯の悪影響（ノイズ）から守られた。'] : []),
            ...getBuffStatusLogMessages(initialPlayerEffects),
            `--- ターン 1 ---`
        ];

        const allInventory = get().inventory || [];
        console.log('[startBattle] inventory count:', allInventory.length);
        const consumables = allInventory.filter(i => i.item_type === 'consumable' || (i as any).type === 'consumable');
        console.log('[startBattle] consumables:', consumables.map(i => ({name: i.name, item_type: i.item_type, use_timing: (i as any).effect_data?.use_timing, qty: i.quantity})));
        const battleItems = allInventory.filter(i =>
            (i.item_type === 'consumable' || (i as any).type === 'consumable') &&
            ((i as any).effect_data?.use_timing === 'battle' || (i as any).use_timing === 'battle') &&
            (i.quantity || 0) > 0
        );
        console.log('[startBattle] battleItems:', battleItems.map(i => ({name: i.name, qty: i.quantity})));

        set({
            battleState: {
                enemy: firstEnemy,
                enemies: enemies,
                party: partyMembers,
                turn: 1,
                current_ap: initialAp,
                cardsPlayedThisTurn: 0,
                messages: startMessages,
                isVictory: false,
                isDefeat: false,
                currentTactic: 'Aggressive',
                player_effects: initialPlayerEffects,
                enemy_effects: [],
                exhaustPile: [],
                consumedItems: [],
                vitDamageTakenThisTurn: false,
                battle_result: undefined,
                resonanceActive,
                equipBonus,
                equipCountBonusHand, // v4.1: 装備枚数ボーナスによる初期手札追加
                activeSupportBuffs: [],
                battleItems,
                isPlayerTurn: true,
                battlePhase: 'player' as const,
            },
            deck: shuffledDeck,
            discardPile: [],
            hand: []
        });

        get().dealHand();

        // バトルで使用されるSEの事前ロードを実行 (v34.9: 走査対象を shuffledDeck に拡張)
        if (soundManager) {
            const sm = soundManager;
            const seToPreload = new Set<string>(['se_hit', 'se_attack', 'se_magic', 'se_heal', 'se_buff', 'se_debuff', 'se_taunt']);
            
            // 山札に入るすべての初期カード (shuffledDeck) に対して SE をプリロード
            shuffledDeck.forEach(c => {
                const effInfo = getCardEffectInfo(c as any);
                const seKey = CARD_EFFECT_SE_MAP[effInfo.effectType];
                if (seKey) seToPreload.add(seKey);
            });
            
            // バックグラウンドでプリロード（バトル開始自体をブロックしない）
            Promise.all(Array.from(seToPreload).map(key => sm.preloadSE(key))).catch(console.error);
        }

        // バトルBGM: 通常はbgm_battleを使用。ボスBGMはシナリオパラメータで明示指定時のみ。
        // Note: useBgm(viewMode==='battle'?'bgm_battle':...) と二重再生を避けるため、
        // ここでの再生は省略し、useBgm フックに任せる。
        // soundManager?.playBgm('bgm_battle');

        const authHeaders = await getAuthHeaders();
        fetch('/api/battle/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders
            },
            body: JSON.stringify({
                enemies,
                party: partyMembers,
                initial_ap: initialAp,
                resonance_active: resonanceActive,
                player_stats: { hp: userProfile?.hp, max_hp: userProfile?.max_hp, atk: userProfile?.atk, def: userProfile?.def }
            })
        }).then(res => res.json()).then(data => {
            if (data.battle_session_id) {
                set(state => ({ battleState: { ...state.battleState, battle_session_id: data.battle_session_id } }));
            }
        }).catch(err => console.error('Server Battle Sync Error', err));
    },

    // v15.0: runNpcPhase -- NPCフェーズ（旧 endTurn、setTimeout 廃止）
    runNpcPhase: async () => {
        const { battleState, userProfile } = get();
        if (battleState.isVictory || battleState.isDefeat) return;

        // [Security] Sync turn end and AP recovery to server (v28.0)
        if (battleState.battle_session_id) {
            try {
                const authHeaders = await getAuthHeaders();
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                    ...authHeaders
                };
                fetch('/api/battle/action', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        battle_session_id: battleState.battle_session_id,
                        action_type: 'end_turn',
                        log_message: 'Player turn ended'
                    })
                }).then(res => res.json()).then(data => {
                    if (data.error) console.warn('Server end_turn validation failed:', data.error);
                }).catch(err => console.error('End turn sync failed:', err));
            } catch (err) {
                console.error('End turn sync auth headers failed:', err);
            }
        }

        const nextTurn = battleState.turn + 1;

        if (nextTurn > 30) {
            soundManager?.playSE('se_battle_lose');
            set(state => ({
                battleState: {
                    ...state.battleState,
                    isDefeat: true,
                    battle_result: 'time_over',
                    messages: [...state.battleState.messages, '--- 30ターン経過 --- 時間切れ… 撃退を余儀なくされた。'],
                    battlePhase: 'npc_done',
                }
            }));
            return;
        }

        let newAp = battleState.current_ap || 0;

        // Bug fix: tickEffectsを先に実行し、tick後のeffectsでスタン判定する
        // 修正前は tickEffects 前の古い effects で isStunned を判定していたため、
        // スタンの付与/解除とAP回復が1ターンずれていた
        let playerEffects = [...(battleState.player_effects || [])] as StatusEffect[];
        const wasStunned = isStunned(playerEffects); // tick前のスタン状態を記録
        const playerMaxHp = getEffectiveMaxHp(userProfile, battleState);
        const playerTick = tickEffects(playerEffects, playerMaxHp, 'あなた');
        playerEffects = playerTick.newEffects;
        const tickMessages: string[] = [...playerTick.messages];

        // 味方NPCのステート効果時間減少処理 (Bug I)
        let updatedParty = [...(battleState.party || [])];
        updatedParty = updatedParty.map(member => {
            if (!member.is_active || (member.durability ?? 100) <= 0) return member;
            const mEffects = [...(member.status_effects || [])] as StatusEffect[];
            const maxDur = member.max_durability || member.durability || 100;
            const mTick = tickEffects(mEffects, maxDur, member.name);
            tickMessages.push(...mTick.messages);
            let newDur = Math.max(0, (member.durability || 0) + mTick.hpDelta);
            newDur = Math.min(maxDur, newDur);
            if (mTick.hpDelta !== 0) {
                tickMessages.push(`__party_sync:${member.id}:${newDur}`);
            }
            const isNowActive = newDur > 0;
            if (!isNowActive && member.is_active) {
                tickMessages.push(`${member.name}は力尽きた...`);
                if (member.origin_type !== 'quest_guest') {
                    supabase.from('party_members').update({ durability: 0, is_active: false }).eq('id', member.id).then();
                }
            }
            return {
                ...member,
                durability: newDur,
                status_effects: mTick.newEffects,
                is_active: isNowActive
            };
        });

        // プレイヤーの死神の宣告による即死処理 (Bug V)
        let finalHpDelta = playerTick.hpDelta;
        if (playerTick.expired.includes('death_sentence')) {
            finalHpDelta = -(userProfile?.hp || 0);
            tickMessages.push(`💀 あなたは死神の宣告により即死した！`);
        }

        // tick後もスタン中（= duration >= 2 で付与された場合）はAP回復スキップ
        // tick前にスタンだったが tick後に解除された場合もこのターンはAP回復スキップ
        // （スタン中のターンではAP回復しない仕様）
        if (!wasStunned) {
            newAp = Math.min(10, newAp + 5);
        }

        let isDeadFromDoT = false;
        if ((finalHpDelta !== 0 || playerTick.expired.includes('death_sentence')) && userProfile) {
            const newHp = Math.max(0, Math.min(playerMaxHp, (userProfile.hp || 0) + finalHpDelta));
            isDeadFromDoT = newHp <= 0;
            set(state => ({
                userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
            }));
            tickMessages.push(`__hp_sync:${newHp}`);
            const { selectedProfileId } = get();
            updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
        }

        if (isDeadFromDoT) {
            soundManager?.playSE('se_battle_lose');
            set(state => ({
                battleState: {
                    ...state.battleState,
                    isDefeat: true,
                    messages: [...state.battleState.messages, ...tickMessages, 'あなたは力尽きた...'],
                    player_effects: playerEffects,
                    enemies: updatedEnemies,
                    enemy: currentTarget,
                    vitDamageTakenThisTurn: false,
                    battlePhase: 'npc_done',
                }
            }));
            return;
        }

        // ─── attackEnemy の段階で既に全敵HP0の場合は即勝利（NPCフェーズ不要）───
        const preCheckAllDead = battleState.enemies.every(e => e.hp <= 0);
        if (preCheckAllDead && battleState.enemies.length > 0) {
            soundManager?.playSE('se_battle_win');
            set(state => ({
                battleState: {
                    ...state.battleState,
                    isVictory: true,
                    battle_result: 'victory',
                    battlePhase: 'npc_done',
                    messages: [...state.battleState.messages, '全ての敵を倒した！ 勝利！']
                }
            }));
            return;
        }

        let updatedEnemies = [...battleState.enemies];
        let allEnemiesDead = true;

        updatedEnemies = updatedEnemies.map(enemy => {
            if (enemy.hp <= 0) return enemy;
            let eEffects = [...(enemy.status_effects || [])] as StatusEffect[];
            const eTick = tickEffects(eEffects, enemy.maxHp, enemy.name);
            tickMessages.push(...eTick.messages);
            let newHp = Math.max(0, enemy.hp + eTick.hpDelta);
            if (eTick.expired.includes('death_sentence')) {
                if (enemy.death_immune) {
                    const bossDmg = Math.max(300, Math.floor(enemy.maxHp * 0.2));
                    newHp = Math.max(0, newHp - bossDmg);
                    tickMessages.push(`💀 ${enemy.name}は即死耐性により即死を無効化し、代わりに ${bossDmg} の大ダメージを受けた！`);
                } else {
                    newHp = 0;
                    tickMessages.push(`💀 ${enemy.name}は死神の宣告により即死した！`);
                }
            }
            if (newHp > 0) allEnemiesDead = false;
            return { ...enemy, hp: newHp, status_effects: eTick.newEffects };
        });

        let currentTarget = battleState.enemy;
        if (currentTarget) {
            const updatedTarget = updatedEnemies.find(e => e.id === currentTarget!.id);
            if (updatedTarget) currentTarget = updatedTarget;
            if (currentTarget.hp <= 0 && !allEnemiesDead) {
                const firstAlive = updatedEnemies.find(e => e.hp > 0);
                if (firstAlive) {
                    currentTarget = firstAlive;
                    tickMessages.push(`ターゲットを ${firstAlive.name} に切り替えた。`);
                }
            }
        }

        set(state => ({
            battleState: {
                ...state.battleState,
                current_ap: newAp,
                messages: [...state.battleState.messages, ...tickMessages],
                player_effects: playerEffects,
                enemies: updatedEnemies,
                enemy: currentTarget,
                party: updatedParty,
                vitDamageTakenThisTurn: false,
                battlePhase: 'npc_done',
            }
        }));

        if (allEnemiesDead) {
            soundManager?.playSE('se_battle_win');
            set(state => ({
                battleState: {
                    ...state.battleState,
                    isVictory: true,
                    battle_result: 'victory',
                    messages: [...state.battleState.messages, '全ての敵を倒した！ 勝利！']
                }
            }));
            return;
        }

        await get().processPartyTurn();
    },

    endTurn: async () => { await get().runNpcPhase(); },

    runEnemyPhase: async () => { await get().processEnemyTurn(true); },

    advanceTurn: () => {
        get().dealHand();
        set(state => ({
            battleState: {
                ...state.battleState,
                isPlayerTurn: true,
                battlePhase: 'player' as const,
                cardsPlayedThisTurn: 0,
            }
        }));
    },

    discardCard: (index: number) => {
        set(state => {
            const newHand = [...state.hand];
            newHand.splice(index, 1);
            return { hand: newHand };
        });
    },

    useItem: async (card: Card) => {
        get().attackEnemy(card);
    },

    dealHand: () => {
        const { deck, discardPile, hand, battleState, userProfile } = get();

        if (deck.length === 0 && discardPile.length === 0 && hand.length === 0) {
            const struggleCard: Card = {
                id: 'struggle',
                name: 'あがき (Struggle)',
                type: 'Skill',
                description: '必死の一撃。敵に1ダメージ、自分にも1ダメージ。',
                cost: 0,
                ap_cost: 0,
                power: 1,
            };
            set({
                hand: [struggleCard],
                battleState: {
                    ...battleState,
                    messages: [...battleState.messages, '手札も山札も尽きた…「あがき」が手に宿る！']
                }
            });
            return;
        }

        const level = userProfile?.level || 1;
        const handSizeRule = GROWTH_RULES.HAND_SIZE_BY_LEVEL.find(r => level >= r.minLevel);
        let maxHandSize = handSizeRule?.size ?? 3;
        // v4.1: 初ターンのみ装備枚数ボーナスで手札+1
        const bonusHand = (battleState as any).equipCountBonusHand || 0;
        if (battleState.turn === 1 && hand.length === 0 && bonusHand > 0) {
            maxHandSize += bonusHand;
        }

        const drawCount = maxHandSize - hand.length;
        if (drawCount <= 0) return;

        let currentDeck = [...deck];
        let currentDiscard = [...discardPile];
        const newHand = [...hand];

        for (let i = 0; i < drawCount; i++) {
            if (currentDeck.length === 0) {
                if (currentDiscard.length === 0) break;
                currentDeck = [...currentDiscard].sort(() => 0.5 - Math.random());
                currentDiscard = [];
            }
            const card = currentDeck.pop();
            if (card) newHand.push(card);
        }

        set({ deck: currentDeck, discardPile: currentDiscard, hand: newHand });
    },

    useBattleItem: async (item: InventoryItem) => {
        const { battleState, userProfile } = get();
        if (battleState.isVictory || battleState.isDefeat) return;

        // 行動不可状態・ターンフェーズチェック (Bug H)
        const isPlayerStunned = isStunned((battleState.player_effects || []) as StatusEffect[]);
        const isPlayerPhase = (battleState.battlePhase ?? 'player') === 'player';
        if (!isPlayerPhase || isPlayerStunned) {
            console.warn('[useBattleItem] 行動不可またはプレイヤーターン外のためアイテムを使用できません');
            return;
        }

        const ed = (item as any).effect_data || {};
        const prevHp = userProfile?.hp ?? 0;
        let newHp = prevHp;
        const maxHp = getEffectiveMaxHp(userProfile, get());
        let newPlayerEffects = [...(battleState.player_effects || [])] as any[];
        let newEnemyEffects = [...(battleState.enemy_effects || [])] as any[];
        let fleeNow = false;
        let effectApplied = false;
        let updatedEnemies = [...(battleState.enemies || [])];

        const effectLabel: Record<string, string> = {
            regen: 'リジェネ', atk_up: '攻撃力上昇', def_up: '防御力上昇',
            stun_immune: 'スタン無効', evasion_up: '回避上昇', taunt: '挑発',
            poison: '毒', burn: '炎上', stun: 'スタン', bind: '拘束', bleed: '出血',
            fear: '恐怖', blind: '盲目', atk_down: '攻撃力低下', def_down: '防御力低下',
        };
        const effectName = (id: string) => effectLabel[id] || id;
        const itemMessages: string[] = [];

        if (ed.escape || ed.escape_chance) {
            effectApplied = true;
            const chance = ed.escape_chance ?? 1.0; // escape:true は100%
            if (Math.random() < chance) {
                fleeNow = true;
                itemMessages.push(`💨 ${item.name}を使った。煙幕に乗じて逃走した！`);
            } else {
                itemMessages.push(`💨 ${item.name}を使ったが、逃走に失敗した！`);
            }
        }

        const healAmount = ed.heal || ed.heal_hp || ed.heal_amount || 0;
        const healPct = ed.heal_pct || ed.heal_percent || 0;
        const isHealItem = !!(ed.heal_full || ed.heal_all || healAmount > 0 || healPct > 0);
        const hasOtherEffect = !!(ed.escape || ed.escape_chance || ed.remove_effect || ed.effect_id || ed.damage || ed.aoe_damage);

        if (isHealItem && !hasOtherEffect && prevHp >= maxHp) {
            set(state => ({
                battleState: {
                    ...state.battleState,
                    messages: [...state.battleState.messages, `💊 ${item.name}を使おうとしたが、HPが満タンのため使用できない！`]
                }
            }));
            return;
        }

        if (!ed.escape) {
            if (ed.heal_full || ed.heal_all) {
                effectApplied = true;
                const healed = maxHp - prevHp;
                newHp = maxHp;
                itemMessages.push(`✨ ${item.name}を使用。HP が全回復した！ (+${healed}) HP: ${prevHp} → ${newHp}/${maxHp}`);
            } else if (healAmount > 0) {
                effectApplied = true;
                const healed = Math.min(healAmount, maxHp - prevHp);
                newHp = prevHp + healed;
                itemMessages.push(`💊 ${item.name}を使用した。HP +${healed} 回復！ (HP: ${prevHp} → ${newHp}/${maxHp})`);
            } else if (healPct > 0) {
                effectApplied = true;
                const healed = Math.min(Math.floor(maxHp * healPct), maxHp - prevHp);
                newHp = prevHp + healed;
                itemMessages.push(`💊 ${item.name}を使用した。HP +${healed} 回復！ (HP: ${prevHp} → ${newHp}/${maxHp})`);
            }
        }

        if (ed.remove_effect) {
            effectApplied = true;
            const existed = newPlayerEffects.some((e: any) => e.id === ed.remove_effect);
            newPlayerEffects = newPlayerEffects.filter((e: any) => e.id !== ed.remove_effect);
            if (existed) {
                itemMessages.push(`🌿 ${item.name}を使用。状態異常「${effectName(ed.remove_effect)}」を解除した！`);
            } else {
                itemMessages.push(`🌿 ${item.name}を使用したが、その状態異常は付与されていない。`);
            }
        }

        // ■ 単体ダメージ（聖水・火炎瓶等）
        if (ed.damage && ed.damage > 0) {
            effectApplied = true;
            // target_slug指定: 特定の敵にのみダメージを与える（五英霊の誓約等）
            const targetSlug = ed.target_slug;
            let targetEnemy: any = null;
            if (targetSlug) {
                targetEnemy = updatedEnemies.find((e: any) => e.slug === targetSlug && e.hp > 0);
                if (!targetEnemy) {
                    itemMessages.push(`⚠️ ${item.name}を使用したが、この敵には効果がないようだ…`);
                }
            } else {
                targetEnemy = updatedEnemies.find((e: any) => e.id === battleState.enemy?.id && e.hp > 0)
                    || updatedEnemies.find((e: any) => e.hp > 0);
            }
            if (targetEnemy) {
                // target_slug指定時はDEF無視で固定ダメージ（五英霊の誓約は2000固定ダメージ）
                const dmg = targetSlug ? ed.damage : Math.max(1, ed.damage - (targetEnemy.def || 0));
                const newEnemyHp = Math.max(0, targetEnemy.hp - dmg);
                updatedEnemies = updatedEnemies.map((e: any) =>
                    e.id === targetEnemy.id ? { ...e, hp: newEnemyHp } : e
                );
                if (targetSlug) {
                    itemMessages.push(`⚡ ${item.name}が共鳴した！ 五英霊の怨念が${targetEnemy.name}に解放された！ ${dmg}ダメージ！ (HP: ${targetEnemy.hp} → ${newEnemyHp})`);
                } else if (newEnemyHp <= 0) {
                    itemMessages.push(`💥 ${item.name}を投げつけた！ ${targetEnemy.name}に${dmg}ダメージ！ ${targetEnemy.name}を倒した！`);
                } else {
                    itemMessages.push(`💥 ${item.name}を投げつけた！ ${targetEnemy.name}に${dmg}ダメージ！ (HP: ${targetEnemy.hp} → ${newEnemyHp})`);
                }
            }
        }

        // ■ 全体ダメージ（大型爆弾等）
        if (ed.aoe_damage && ed.aoe_damage > 0) {
            effectApplied = true;
            let totalDmg = 0;
            let killCount = 0;
            updatedEnemies = updatedEnemies.map((e: any) => {
                if (e.hp <= 0) return e;
                const dmg = Math.max(1, ed.aoe_damage - (e.def || 0));
                const newEnemyHp = Math.max(0, e.hp - dmg);
                totalDmg += dmg;
                if (newEnemyHp <= 0) killCount++;
                return { ...e, hp: newEnemyHp };
            });
            const aliveCount = updatedEnemies.filter((e: any) => e.hp > 0).length;
            itemMessages.push(`💣 ${item.name}が炸裂！ 敵全体に${ed.aoe_damage}ダメージ！${killCount > 0 ? ` ${killCount}体を撃破！` : ''} (残: ${aliveCount}体)`);
        }

        if (ed.effect_id) {
            effectApplied = true;
            const duration = ed.effect_duration ?? 3;
            const isEnemy = ed.target === 'enemy';
            const isSelfBuff = isSelfBuffEffect(ed.effect_id);

            if (isEnemy) {
                const targetEnemy = updatedEnemies.find((e: any) => e.id === battleState.enemy?.id && e.hp > 0)
                    || updatedEnemies.find((e: any) => e.hp > 0);
                if (targetEnemy) {
                    const enemyEffects = (targetEnemy.status_effects || []) as StatusEffect[];
                    const isStunEffect = ed.effect_id === 'stun' || ed.effect_id === 'bind' || ed.effect_id === 'freeze';
                    const finalDuration = isStunEffect ? duration + 1 : duration; // 持続時間+1T補正 (Bug AF)
                    const newEffects = applyEffect(enemyEffects, ed.effect_id, finalDuration);
                    updatedEnemies = updatedEnemies.map((e: any) =>
                        e.id === targetEnemy.id ? { ...e, status_effects: newEffects } : e
                    );
                    itemMessages.push(`🔮 ${item.name}を投げつけた！ ${targetEnemy.name}に「${effectName(ed.effect_id)}」を付与した！(${finalDuration}ターン)`);
                } else {
                    itemMessages.push(`🔮 ${item.name}を使用したが、対象の敵が見つからなかった。`);
                }
            } else if (isSelfBuff) {
                newPlayerEffects = [
                    ...newPlayerEffects.filter((e: any) => e.id !== ed.effect_id),
                    { id: ed.effect_id, duration }
                ];
                itemMessages.push(`✨ ${item.name}の効果で「${effectName(ed.effect_id)}」が付与された！(${duration}ターン)`);
            } else {
                newPlayerEffects = [...newPlayerEffects, { id: ed.effect_id, duration }];
                itemMessages.push(`✨ ${item.name}を使用。「${effectName(ed.effect_id)}」が発動した！(${duration}ターン)`);
            }
        }

        // ■ 消耗品の一時バフ（大聖堂の祝福等: atk_bonus/def_bonus を持つ消耗品）
        if (!ed.effect_id && (ed.atk_bonus || ed.def_bonus) && ed.use_timing === 'battle') {
            effectApplied = true;
            const duration = ed.duration ?? 3;
            const parts: string[] = [];
            if (ed.atk_bonus && ed.atk_bonus > 0) {
                newPlayerEffects = [
                    ...newPlayerEffects.filter((e: any) => e.id !== 'atk_up'),
                    { id: 'atk_up', duration, value: ed.atk_bonus } // value プロパティをセット (Bug O)
                ];
                parts.push(`攻撃力UP`);
            }
            if (ed.def_bonus && ed.def_bonus > 0) {
                newPlayerEffects = [
                    ...newPlayerEffects.filter((e: any) => e.id !== 'def_up'),
                    { id: 'def_up', duration, value: ed.def_bonus } // value プロパティをセット (Bug O)
                ];
                parts.push(`防御力UP`);
            }
            if (parts.length > 0) {
                itemMessages.push(`✨ ${item.name}の祝福！ 「${parts.join('・')}」が付与された！(${duration}ターン)`);
            }
        }

        // ■ 自分へのスタン（強い酒等: 飲んだ後に確率でスタン）
        if (ed.stun_self_chance != null && ed.stun_self_chance > 0) {
            if (Math.random() < ed.stun_self_chance) {
                const stunDur = ed.stun_self_duration ?? 1;
                const finalStunDur = stunDur + 1; // 自スタン補正 +1T
                newPlayerEffects = [
                    ...newPlayerEffects.filter((e: any) => e.id !== 'stun'),
                    { id: 'stun', duration: finalStunDur }
                ];
                itemMessages.push(`🍺 ${item.name}に酔ってしまった！ 1ターン行動不能！`);
            }
        }

        // ■ DEFペナルティ（熱砂の香辛料等: 自分にdef_down付与）
        if (ed.def_penalty != null && ed.def_penalty > 0) {
            const penaltyDur = ed.effect_duration ?? ed.duration ?? 3;
            newPlayerEffects = [
                ...newPlayerEffects.filter((e: any) => e.id !== 'def_down'),
                { id: 'def_down', duration: penaltyDur }
            ];
            itemMessages.push(`⚠️ ${item.name}の副作用で「防御力DOWN」が付与された！(${penaltyDur}ターン)`);
        }

        // ■ 追加エフェクト（禁術の秘薬等: 複数バフを同時付与）
        if (Array.isArray(ed.extra_effects)) {
            for (const extra of ed.extra_effects) {
                if (!extra.id) continue;
                const dur = extra.duration ?? 3;
                const isBuff = ['regen', 'atk_up', 'def_up', 'stun_immune', 'evasion_up'].includes(extra.id);
                if (isBuff) {
                    newPlayerEffects = [
                        ...newPlayerEffects.filter((e: any) => e.id !== extra.id),
                        { id: extra.id, duration: dur }
                    ];
                    itemMessages.push(`✨ ${item.name}の効果で「${effectName(extra.id)}」が付与された！(${dur}ターン)`);
                }
            }
        }

        if (!effectApplied) {
            itemMessages.push(`（${item.name}を使用したが、何も起きなかった…）`);
            console.warn('[useBattleItem] No recognized effect_data keys for item:', item.name, ed);
        }

        if (newHp !== prevHp) {
            itemMessages.push(`__hp_sync:${newHp}`);
        }

        const newBattleItems = battleState.battleItems.map(bi =>
            bi.id === item.id ? { ...bi, quantity: (bi.quantity || 1) - 1 } : bi
        );

        const finalAllDead = updatedEnemies.every(e => e.hp <= 0);
        const isPlayerDead = newHp <= 0;

        if (isPlayerDead) {
            itemMessages.push('あなたは力尽きた...');
        } else if (finalAllDead) {
            itemMessages.push('アイテムの威力により、敵を打ち倒した！ 勝利！');
        }

        set(state => ({
            userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
            inventory: state.inventory.map((inv: any) =>
                inv.id === item.id ? { ...inv, quantity: (inv.quantity || 1) - 1 } : inv
            ),
            battleState: {
                ...state.battleState,
                messages: [...state.battleState.messages, ...itemMessages],
                player_effects: newPlayerEffects,
                battleItems: newBattleItems,
                enemies: updatedEnemies,
                enemy: finalAllDead ? null : updatedEnemies.find(e => e.id === state.battleState.enemy?.id && e.hp > 0) || updatedEnemies.find(e => e.hp > 0) || null,
                isVictory: !isPlayerDead && (finalAllDead || state.battleState.isVictory),
                isDefeat: isPlayerDead || state.battleState.isDefeat,
                consumedItems: [...(state.battleState.consumedItems || []), String(item.item_id || item.slug || item.id)]
            }
        }));

        if (isPlayerDead) {
            soundManager?.playSE('se_battle_lose');
            const { selectedProfileId } = get();
            updateProfileStatusHelper({ hp: 0 }, get().userProfile?.id || selectedProfileId);
        }

        const session = await supabase.auth.getSession();
        fetch('/api/item/use', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.data.session?.access_token || ''}`
            },
            body: JSON.stringify({ inventory_id: item.id, use_context: 'battle' })
        }).catch(e => console.warn('[useBattleItem] API同期失敗（続行）', e));

        if (fleeNow) {
            await new Promise(r => setTimeout(r, 800));
            get().fleeBattle(true); // forceSuccessを連携 (Bug AH)
        }
    },

    attackEnemy: async (card?: Card, targetId?: string): Promise<boolean> => {
        const { battleState, selectedScenario, hand, userProfile } = get();

        const effectivePlayerAtk = getEffectiveAtk(userProfile, battleState);
        const effectivePlayerMaxHp = getEffectiveMaxHp(userProfile, battleState);

        const anyAlive = battleState.enemies?.some(e => e.hp > 0);
        if (!anyAlive || battleState.isVictory || battleState.isDefeat) return false;

        let targetEnemyId = targetId || battleState.enemy?.id;
        let targetEnemy = battleState.enemies.find(e => e.id === targetEnemyId);

        if (!targetEnemy || targetEnemy.hp <= 0) {
            targetEnemy = battleState.enemies.find(e => e.hp > 0);
            targetEnemyId = targetEnemy?.id;
        }
        if (!targetEnemy) return false;

        const tempPlayerEffects = [...(battleState.player_effects || [])] as StatusEffect[];
        const tempEnemyEffects = [...(targetEnemy?.status_effects || [])] as StatusEffect[];
        let finalApCost = card ? getCardApCost(card, tempPlayerEffects, tempEnemyEffects) : 1;
        const isSkillOrMagic = card && (card.type === 'Skill' || card.type === 'Magic');
        const hasDoubleCast = isSkillOrMagic && hasEffect(tempPlayerEffects as StatusEffect[], 'double_cast' as StatusEffectId);

        if (card) {
            const resolvedTargetId = targetId || getDefaultTarget(card, battleState);
            const validation = validateCardUse(card, resolvedTargetId, battleState);
            if (!validation.valid) {
                set(state => ({ battleState: { ...state.battleState, messages: [...state.battleState.messages, validation.error || '行動できません'] } }));
                return false;
            }
            if (hasDoubleCast) {
                finalApCost = 0;
            }
            set(state => ({
                battleState: {
                    ...state.battleState,
                    current_ap: (battleState.current_ap || 0) - finalApCost,
                    cardsPlayedThisTurn: (state.battleState.cardsPlayedThisTurn || 0) + 1
                }
            }));

            if (card.cost_type === 'item') {
                const baseId = card.id.match(/^(\d+)/)?.[1] || card.id;
                if (battleState.consumedItems?.some(cid => cid.startsWith(baseId))) {
                    set(state => ({
                        battleState: {
                            ...state.battleState,
                            current_ap: (state.battleState.current_ap || 0) + finalApCost,
                            cardsPlayedThisTurn: Math.max(0, (state.battleState.cardsPlayedThisTurn || 0) - 1),
                            messages: [...state.battleState.messages, `${card.name}の素材が尽きた！（1戦闘1回制限）`]
                        }
                    }));
                    return false;
                }
            }
        }

        // [Security] JWT認証付きでサーバーにアクション同期 (v27.2)
        if (card && battleState.battle_session_id) {
            // ノンブロッキングでバックグラウンド実行（演出とローカル計算の即時開始のため）
            (async () => {
                try {
                    const authHeaders = await getAuthHeaders();
                    const headers: HeadersInit = {
                        'Content-Type': 'application/json',
                        ...authHeaders
                    };
                    const res = await fetch('/api/battle/action', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            battle_session_id: battleState.battle_session_id,
                            action_type: 'attack_enemy',
                            card,
                            target_id: targetEnemyId,
                            log_message: `Used ${card?.name}`
                        })
                    });
                    const data = await res.json();
                    if (data.error) console.warn('Server validation failed:', data.error);
                } catch (err) {
                    console.error('Action sync failed:', err);
                }
            })();
        }

        let nextHand = [...hand];
        let nextDiscardPile = [...get().discardPile];
        let logMsg = '';
        let healSyncHp: number | null = null;
        let damage = 0;
        let isAoe = false;
        let effectInfo: ReturnType<typeof getCardEffectInfo> | undefined;

        if (card && (card.type === 'noise' || card.type === 'Basic' && card.name === 'Noise')) {
            const purgeCost = (card as any).discard_cost ?? 1;
            nextHand = nextHand.filter(c => c.id !== card.id);
            set(state => ({
                battleState: {
                    ...state.battleState,
                    exhaustPile: [...state.battleState.exhaustPile, { id: card.id, name: card.name, type: card.type }],
                    messages: [...state.battleState.messages, `${card.name}を廃棄した！ (AP -${purgeCost})`]
                },
                hand: nextHand,
            }));
            return true;
        }

        let currentEnemies = battleState.enemies.map(e => ({ ...e, status_effects: [...(e.status_effects || []).map(se => ({ ...se }))] }));
        let currentPlayerEffects = [...(battleState.player_effects || []).map(se => ({ ...se }))];
        let currentConsumedItems = [...(battleState.consumedItems || [])];
        let currentExhaustPile = [...(battleState.exhaustPile || []).map(ep => ({ ...ep }))];
        let currentActiveSupportBuffs = [...(battleState.activeSupportBuffs || [])];
        let newMessages = [...battleState.messages];

        if (hasDoubleCast) {
            currentPlayerEffects = removeEffect(currentPlayerEffects as StatusEffect[], 'double_cast' as StatusEffectId);
        }

        const loops = hasDoubleCast ? 2 : 1;
        let allDead = false;

        if (card) {
            const bleedDmg = getBleedDamage(currentPlayerEffects as StatusEffect[]);
            if (bleedDmg > 0 && userProfile) {
                const newHp = Math.max(0, (userProfile.hp || 0) - bleedDmg);
                set(state => ({
                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                }));
                newMessages.push(`出血ダメージ！ HP -${bleedDmg}`);
            }

            if (card.id === 'struggle' && userProfile) {
                const selfDmg = 1;
                const newHp = Math.max(0, (userProfile.hp || 0) - selfDmg);
                set(state => ({
                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                }));
                newMessages.push(`あがきの反動！ HP -${selfDmg}`);
            }

            effectInfo = getCardEffectInfo(card);
            soundManager?.playSEForCardEffect(effectInfo.effectType);

            // Soul Boost check
            let damageMultiplier = 1;
            const hasSoulBoost = card && (card.type === 'Skill' || card.type === 'Magic') && currentPlayerEffects.some(se => se.id === 'soul_boost');
            if (hasSoulBoost) {
                damageMultiplier = 2.5;
                currentPlayerEffects = currentPlayerEffects.filter(se => se.id !== 'soul_boost');
            }

            // Element Resonance check
            const hasElementResonance = card && card.type === 'Magic' && currentPlayerEffects.some(se => se.id === 'element_resonance');
            if (hasElementResonance) {
                currentPlayerEffects = currentPlayerEffects.filter(se => se.id !== 'element_resonance');
                const cardName = card.name;
                const cardSlug = card.slug || '';
                const isFire = cardName.includes('炎') || cardName.includes('火') || cardName.includes('ファイア') || cardName.includes('フレイム') || cardSlug.includes('fire') || cardSlug.includes('flame') || cardSlug.includes('prominence');
                const isIce = cardName.includes('氷') || cardName.includes('凍') || cardName.includes('フリーズ') || cardName.includes('零') || cardSlug.includes('freeze') || cardSlug.includes('frozen') || cardSlug.includes('absolute');
                const isLightning = cardName.includes('雷') || cardName.includes('電') || cardName.includes('プラズマ') || cardSlug.includes('lightning') || cardSlug.includes('plasma');
                
                let resBuffId: StatusEffectId | null = null;
                let resBuffVal = 0;
                let resonanceMsg = '';
                if (isFire) {
                    resBuffId = 'atk_up';
                    resBuffVal = 0.10;
                    resonanceMsg = '属性共鳴(炎)！全員の攻撃力+10% (3T)！';
                } else if (isIce) {
                    resBuffId = 'def_up';
                    resBuffVal = 10;
                    resonanceMsg = '属性共鳴(氷)！全員の防御力+10 (3T)！';
                } else if (isLightning) {
                    resBuffId = 'evasion_up';
                    resBuffVal = 0.10;
                    resonanceMsg = '属性共鳴(雷)！全員の回避率+10% (3T)！';
                }
                
                if (resBuffId) {
                    currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], resBuffId, 3, resBuffVal);
                    const newParty = (battleState.party || []).map(m => {
                        if (!m.is_active || (m.durability ?? 0) <= 0) return m;
                        return {
                            ...m,
                            status_effects: applyEffect((m.status_effects || []) as StatusEffect[], resBuffId!, 3, resBuffVal)
                        };
                    });
                    set(state => ({ battleState: { ...state.battleState, party: newParty } }));
                    newMessages.push(`✨ ${resonanceMsg}`);
                }
            }

            // Mana Charge check
            const hasManaCharge = card && card.type === 'Magic' && currentPlayerEffects.some(se => se.id === 'mana_charge');
            if (hasManaCharge) {
                newMessages.push(`✨ マナチャージの効果でAPが1回復した！`);
                set(state => ({
                    battleState: {
                        ...state.battleState,
                        current_ap: Math.min(15, (state.battleState.current_ap || 0) + 1)
                    }
                }));
            }

            // v4.0: プレイヤー攻撃ミス判定（攻撃系アクションのみ）
            const attackEffectTypes = ['aoe_attack', 'debuff_enemy', 'instakill', 'pierce_attack', 'multi_attack', 'recoil_attack'];
            const isAttackAction = attackEffectTypes.includes(effectInfo.effectType) || !['heal', 'escape', 'buff_self', 'taunt', 'buff_party', 'cure_self', 'support_activate'].includes(effectInfo.effectType);
            if (isAttackAction && (card.power ?? 0) > 0 && rollMiss(BATTLE_RULES.PLAYER_MISS_RATE)) {
                logMsg = `${card.name}を使用！ ミス！ 攻撃は外れた！`;
                nextHand = nextHand.filter(c => c.id !== card.id);
                nextDiscardPile = [...nextDiscardPile, card];

                // --- デトネーションのミス時手札破棄処理の追加 ---
                if (effectInfo.effectType === 'detonation') {
                    const otherHandCards = nextHand.filter(c => c.id !== card.id);
                    let exhaustedCount = 0;
                    const exhaustedList: typeof nextHand = [];
                    while (exhaustedCount < 2 && otherHandCards.length > 0) {
                        const randIdx = Math.floor(Math.random() * otherHandCards.length);
                        const removed = otherHandCards.splice(randIdx, 1)[0];
                        nextHand = nextHand.filter(c => c.id !== removed.id);
                        exhaustedList.push(removed);
                        exhaustedCount++;
                    }
                    if (exhaustedList.length > 0) {
                        const finalExhaustedList = exhaustedList.map(c => ({ id: c.id, name: c.name, type: c.type }));
                        set(state => ({
                            battleState: {
                                ...state.battleState,
                                exhaustPile: [...(state.battleState.exhaustPile || []), ...finalExhaustedList]
                            }
                        }));
                        logMsg += ` さらに手札から「${exhaustedList.map(c => c.name).join('」「')}」が除外された！`;
                    }
                }

                set(state => ({
                    hand: nextHand,
                    discardPile: nextDiscardPile,
                    battleState: {
                        ...state.battleState,
                        player_effects: currentPlayerEffects,
                        messages: [...newMessages, logMsg]
                    }
                }));
                return true;
            }

            for (let loop = 0; loop < loops; loop++) {
                let loopTargetEnemyId = targetId || battleState.enemy?.id;
                let loopTargetEnemy = currentEnemies.find(e => e.id === loopTargetEnemyId);

                if (!loopTargetEnemy || loopTargetEnemy.hp <= 0) {
                    loopTargetEnemy = currentEnemies.find(e => e.hp > 0);
                    loopTargetEnemyId = loopTargetEnemy?.id;
                }
                if (!loopTargetEnemy) {
                    allDead = true;
                    break;
                }

                damage = 0;
                isAoe = false;
                let customTargetEffects: StatusEffect[] | null = null;
                logMsg = '';
                healSyncHp = null;

                switch (effectInfo.effectType) {
                    case 'catharsis': {
                        const basePower = card.power ?? 0;
                        const isMagic = true;
                        const result = calculateDamageV4(basePower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], isMagic, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        let finalDmg = result.damage;

                        const targetMaxHp = loopTargetEnemy.maxHp || 100;
                        const dotPerTurn = Math.max(1, Math.floor(targetMaxHp * 0.05));
                        
                        let detonateDmg = 0;
                        const poisonEffect = loopTargetEnemy.status_effects?.find(e => e.id === 'poison');
                        const burnEffect = loopTargetEnemy.status_effects?.find(e => e.id === 'burn');
                        
                        if (poisonEffect) {
                            detonateDmg += poisonEffect.duration * dotPerTurn;
                        }
                        if (burnEffect) {
                            detonateDmg += burnEffect.duration * dotPerTurn;
                        }
                        
                        finalDmg += detonateDmg;
                        damage = finalDmg;
                        
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel}`;
                        if (detonateDmg > 0) {
                            logMsg += ` 状態異常を起爆！ 追加 ${detonateDmg} ダメージ！`;
                        }
                        logMsg += ` 合計 ${finalDmg} のダメージ！`;

                        customTargetEffects = (loopTargetEnemy.status_effects || []).filter(e => e.id !== 'poison' && e.id !== 'burn') as StatusEffect[];
                        break;
                    }
                    case 'shield_slam': {
                        const defBonus = getDefBonus(currentPlayerEffects as StatusEffect[]);
                        const baseDamage = 10 + defBonus;
                        
                        const result = calculateDamageV4(baseDamage, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        damage = result.damage;
                        
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} 防御力を乗せた衝撃で ${damage} のダメージ！`;
                        
                        currentPlayerEffects = currentPlayerEffects.filter(
                            e => e.id !== 'def_up' && e.id !== 'def_up_heavy' && e.id !== 'barrier'
                        );
                        break;
                    }
                    case 'pay_to_win': {
                        const currentGold = userProfile?.gold || get().gold || 0;
                        const spentGold = Math.min(1000, Math.floor(currentGold * 0.02));
                        const newGold = Math.max(0, currentGold - spentGold);
                        
                        set(state => ({
                            gold: newGold,
                            userProfile: state.userProfile ? { ...state.userProfile, gold: newGold } : null
                        }));
                        
                        const { selectedProfileId } = get();
                        updateProfileStatusHelper({ gold: newGold }, get().userProfile?.id || selectedProfileId);
                        
                        const bonusDmg = Math.floor(spentGold / 10);
                        const basePower = (card.power ?? 30) + bonusDmg;
                        
                        const result = calculateDamageV4(basePower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        damage = result.damage;
                        
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} 金貨 ${spentGold} 枚を投げつけて ${damage} のダメージ！ (残り金貨: ${newGold})`;
                        break;
                    }
                    case 'double_cast': {
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'double_cast' as StatusEffectId, 1);
                        logMsg = `${card.name}を唱えた！ 次に使用する「Magic」または「Skill」カードが2回連続で発動する！`;
                        break;
                    }
                    case 'search_light': {
                        const deck = get().deck;
                        const matchCards = deck.filter(c => c.type === 'Heal' || c.type === 'Defense');
                        if (matchCards.length > 0) {
                            const chosenCard = matchCards[Math.floor(Math.random() * matchCards.length)];
                            nextHand.push(chosenCard);
                            const newDeck = deck.filter(c => c !== chosenCard);
                            set({ deck: newDeck });
                            logMsg = `${card.name}を使用！ デッキから「${chosenCard.name}」を探し出して手札に加えた。`;
                        } else {
                            logMsg = `${card.name}を使用したが、デッキに対象となるカード（回復・防御）がなかった。`;
                        }
                        break;
                    }
                    case 'wound_tear': {
                        const hasBleed = loopTargetEnemy.status_effects?.some(e => e.id === 'bleed' || e.id === 'bleed_minor');
                        const basePower = (hasBleed ? 62 : 25) * damageMultiplier;
                        const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                        const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                        const result = calculateDamageV4(basePower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, finalCritRate);
                        damage = result.damage;
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} ${damage} のダメージ！`;
                        if (hasBleed) {
                            customTargetEffects = (loopTargetEnemy.status_effects || []).map(e => {
                                if (e.id === 'bleed' || e.id === 'bleed_minor') {
                                    return { ...e, duration: e.duration + 2 };
                                }
                                return e;
                            }) as StatusEffect[];
                            logMsg += ` 出血の残り持続時間を2ターン延長！`;
                        } else {
                            customTargetEffects = applyEffect((loopTargetEnemy.status_effects || []) as StatusEffect[], 'bleed_minor', 2);
                        }
                        break;
                    }
                    case 'defpless_prey': {
                        const isImmobilized = loopTargetEnemy.status_effects?.some(e => e.id === 'stun' || e.id === 'bind' || e.id === 'freeze');
                        const basePower = (card.power ?? 40) * damageMultiplier;
                        const targetDef = isImmobilized ? 0 : (loopTargetEnemy.def || 0);
                        const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                        const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                        const result = calculateDamageV4(basePower, targetDef, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, finalCritRate);
                        damage = result.damage;
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        if (isImmobilized) {
                            logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} 行動不能の隙を突き、防御力を完全に無視して ${damage} のダメージ！`;
                        } else {
                            logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} ${damage} のダメージ！`;
                        }
                        break;
                    }
                    case 'epidemic_fog': {
                        const poisonedEnemy = currentEnemies.find(e => e.hp > 0 && e.status_effects?.some(se => se.id === 'poison'));
                        const poisonDuration = poisonedEnemy
                            ? (poisonedEnemy.status_effects?.find(se => se.id === 'poison')?.duration || 3)
                            : 0;
                        const basePower = (card.power ?? 15) * damageMultiplier;
                        const result = calculateDamageV4(basePower, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        damage = result.damage;
                        isAoe = true;
                        logMsg = `${card.name}で全体攻撃！ 各敵に ${damage} のダメージ！`;
                        if (poisonDuration > 0) {
                            logMsg += ` さらに、毒が他の全ての敵に伝染した！ (毒 ${poisonDuration}T)`;
                            currentEnemies = currentEnemies.map(e => {
                                if (e.hp <= 0) return e;
                                const newEffects = applyEffect((e.status_effects || []) as StatusEffect[], 'poison', poisonDuration);
                                return { ...e, status_effects: newEffects };
                            });
                        }
                        break;
                    }
                    case 'unyielding_wall': {
                        const playerMaxHp = effectivePlayerMaxHp;
                        const playerHp = userProfile?.hp || 0;
                        const addBarrier = playerHp <= playerMaxHp * 0.3;
                        const defUpVal = card.cost_val || 25;
                        const barrierVal = card.effect_val || 30;
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'def_up', 3, defUpVal);
                        if (addBarrier) {
                            currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'unyielding_barrier', 3, barrierVal);
                        }
                        const newParty = (battleState.party || []).map(m => {
                            if (!m.is_active || (m.durability ?? 0) <= 0) return m;
                            let mEffects = (m.status_effects || []) as StatusEffect[];
                            mEffects = applyEffect(mEffects, 'def_up', 3, defUpVal);
                            if (addBarrier) {
                                mEffects = applyEffect(mEffects, 'unyielding_barrier', 3, barrierVal);
                            }
                            return { ...m, status_effects: mEffects };
                        });
                        set(state => ({ battleState: { ...state.battleState, party: newParty } }));
                        logMsg = `${card.name}を使用！ 味方全体のDEF+${defUpVal} (2T)！`;
                        if (addBarrier) {
                            logMsg += ` 残りHPが30%以下のため、ダメージ${barrierVal}軽減のバリア効果を追加！`;
                        }
                        break;
                    }
                    case 'sacrifice_oath': {
                        const resolvedTargetId = targetId || getDefaultTarget(card, battleState);
                        const party = [...(battleState.party || [])];
                        const idx = party.findIndex(m => String(m.id) === resolvedTargetId);
                        if (idx >= 0) {
                            const member = party[idx];
                            const mEffects = (member.status_effects || []) as StatusEffect[];
                            const debuffs = mEffects.filter(e => NEGATIVE_EFFECTS.includes(e.id));
                            const cleanedMemberEffects = mEffects.filter(e => !NEGATIVE_EFFECTS.includes(e.id));
                            party[idx] = { ...member, status_effects: cleanedMemberEffects };
                            debuffs.forEach(d => {
                                currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], d.id, d.duration, d.value);
                            });
                            const defVal = card.effect_val || 20;
                            currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'def_up', 3, defVal);
                            set(state => ({ battleState: { ...state.battleState, party } }));
                            logMsg = `${card.name}を使用！ ${member.name}のデバフを全て自身に引き受け、自身のDEFを+${defVal} (2T)した！`;
                        } else {
                            logMsg = `${card.name}を使用したが、対象の味方が見つからなかった。`;
                        }
                        break;
                    }
                    case 'desperado': {
                        const playerMaxHp = effectivePlayerMaxHp;
                        const playerHp = userProfile?.hp || 0;
                        const hpRatio = playerHp / playerMaxHp;
                        const multiplier = 1 + 2 * (1 - hpRatio);
                        const basePower = Math.floor((card.power ?? 50) * multiplier * damageMultiplier);
                        const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                        const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                        const result = calculateDamageV4(basePower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, finalCritRate);
                        damage = result.damage;
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} 残りHPに応じて ${damage} のダメージ！ (威力倍率: ${multiplier.toFixed(2)}倍)`;
                        break;
                    }
                    case 'sacrificial_ritual': {
                        const playerMaxHp = effectivePlayerMaxHp;
                        const selfDmg = Math.max(1, Math.floor(playerMaxHp * 0.15));
                        const currentHp = userProfile?.hp || 0;
                        const newHp = Math.max(0, currentHp - selfDmg);
                        set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                        healSyncHp = newHp;
                        const { selectedProfileId } = get();
                        updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'sacrificial_ap', 2);
                        logMsg = `${card.name}を使用！ 最大HPの15%自傷 (-${selfDmg} HP)！ 2ターンの間、物理スキルの消費APを1減少！`;
                        break;
                    }
                    case 'desperate_strike': {
                        const basePower = (card.power ?? 70) * damageMultiplier;
                        const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                        const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                        const result = calculateDamageV4(basePower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, finalCritRate);
                        damage = result.damage;
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'def_down', 2);
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} ${damage} のダメージ！ 自身に2ターンの防御力DOWN（被ダメ1.5倍）を付与した！`;
                        break;
                    }
                    case 'detonation': {
                        const basePower = (card.power ?? 90) * damageMultiplier;
                        const result = calculateDamageV4(basePower, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        damage = result.damage;
                        isAoe = true;
                        logMsg = `${card.name}で全体攻撃！ 各敵に ${damage} のダメージ！`;
                        const otherHandCards = nextHand.filter(c => c.id !== card.id);
                        let exhaustedCount = 0;
                        const exhaustedList: typeof nextHand = [];
                        while (exhaustedCount < 2 && otherHandCards.length > 0) {
                            const randIdx = Math.floor(Math.random() * otherHandCards.length);
                            const removed = otherHandCards.splice(randIdx, 1)[0];
                            nextHand = nextHand.filter(c => c.id !== removed.id);
                            exhaustedList.push(removed);
                            exhaustedCount++;
                        }
                        if (exhaustedList.length > 0) {
                            set(state => ({
                                battleState: {
                                    ...state.battleState,
                                    exhaustPile: [...state.battleState.exhaustPile, ...exhaustedList.map(c => ({ id: c.id, name: c.name, type: c.type }))]
                                }
                            }));
                            logMsg += ` さらに手札から「${exhaustedList.map(c => c.name).join('」「')}」が除外された！`;
                        }
                        break;
                    }
                    case 'freeze_lancer': {
                        const isFrozenOrBound = loopTargetEnemy.status_effects?.some(e => e.id === 'freeze' || e.id === 'bind');
                        const basePower = (isFrozenOrBound ? 45 : 30) * damageMultiplier;
                        const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                        const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                        const result = calculateDamageV4(basePower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], true, effectivePlayerAtk, finalCritRate);
                        damage = result.damage;
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} ${damage} のダメージ！`;
                        if (isFrozenOrBound) {
                            customTargetEffects = applyEffect((loopTargetEnemy.status_effects || []) as StatusEffect[], 'stun', 2);
                            logMsg += ` 対象が凍結・拘束状態のためダメージ1.5倍＋1ターンスタン追加！`;
                        }
                        break;
                    }
                    case 'chain_lightning': {
                        const hitsCount = 3;
                        let hitLogs: string[] = [];
                        let totalDmg = 0;
                        const hitTargetsMap: Record<string, number> = {};
                        for (let hit = 0; hit < hitsCount; hit++) {
                            let aliveEnemies = currentEnemies.filter(e => e.hp > 0);
                            if (aliveEnemies.length === 0) break;
                            const picked = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                            const targetHasCritVul = picked.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                            const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                            const result = calculateDamageV4(20 * damageMultiplier, picked.def || 0, currentPlayerEffects as StatusEffect[], picked.status_effects as StatusEffect[] || [], true, effectivePlayerAtk, finalCritRate);
                            totalDmg += result.damage;
                            currentEnemies = currentEnemies.map(e => e.id === picked.id ? { ...e, hp: Math.max(0, e.hp - result.damage) } : e);
                            hitTargetsMap[picked.id] = (hitTargetsMap[picked.id] || 0) + 1;
                            const critLabel = result.isCritical ? ' クリティカル！' : '';
                            hitLogs.push(`${picked.name}に ${result.damage} ダメージ${critLabel}`);
                        }
                        for (const enemyId of Object.keys(hitTargetsMap)) {
                            if (hitTargetsMap[enemyId] > 1) {
                                const enemyObj = currentEnemies.find(e => e.id === enemyId);
                                if (enemyObj && enemyObj.hp > 0) {
                                    const stunEffects = applyEffect((enemyObj.status_effects || []) as StatusEffect[], 'stun', 2);
                                    currentEnemies = currentEnemies.map(e => e.id === enemyId ? { ...e, status_effects: stunEffects } : e);
                                    hitLogs.push(`${enemyObj.name}は連続ヒットによりスタンした！`);
                                }
                            }
                        }
                        damage = 0;
                        logMsg = `${card.name}！ 連鎖する紫電が炸裂！\n` + hitLogs.join('\n');
                        break;
                    }
                    case 'prominence': {
                        let burnLogs: string[] = [];
                        let prominenceDmg = (card.power ?? 50) * damageMultiplier;
                        currentEnemies = currentEnemies.map(e => {
                            if (e.hp <= 0) return e;
                            const burnEffect = e.status_effects?.find(se => se.id === 'burn');
                            let extra = 0;
                            if (burnEffect) {
                                extra = burnEffect.duration * 10;
                            }
                            const targetHasCritVul = e.status_effects?.some(se => se.id === 'crit_vulnerability' && se.duration > 0);
                            const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                            const result = calculateDamageV4(prominenceDmg, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk, finalCritRate);
                            const finalDmg = result.damage + extra;
                            const newHp = Math.max(0, e.hp - finalDmg);
                            const newEffects = applyEffect((e.status_effects || []) as StatusEffect[], 'burn', 3);
                            if (extra > 0) {
                                burnLogs.push(`${e.name}に極大炎上！ 追加 ${extra} ダメージ！ (合計 ${finalDmg} ダメージ)`);
                            } else {
                                burnLogs.push(`${e.name}に ${finalDmg} ダメージ！`);
                            }
                            return { ...e, hp: newHp, status_effects: newEffects };
                        });
                        damage = 0;
                        logMsg = `${card.name}を発動！ 戦場全体を焼き尽くす！\n` + burnLogs.join('\n');
                        break;
                    }
                    case 'brain_spin': {
                        const handCount = nextHand.filter(c => c.id !== card.id).length;
                        const discardedHand = nextHand.filter(c => c.id !== card.id);
                        nextDiscardPile = [...nextDiscardPile, ...discardedHand];
                        nextHand = [];
                        const deck = get().deck;
                        const drawCount = Math.min(deck.length, handCount);
                        const drawn: typeof nextHand = [];
                        const remainingDeck = [...deck];
                        for (let draw = 0; draw < drawCount; draw++) {
                            if (remainingDeck.length === 0) break;
                            drawn.push(remainingDeck.shift()!);
                        }
                        nextHand = drawn;
                        set({ deck: remainingDeck });
                        const currentAp = battleState.current_ap || 0;
                        const newAp = Math.min(15, currentAp + 1);
                        set(state => ({ battleState: { ...state.battleState, current_ap: newAp } }));
                        logMsg = `${card.name}を使用！ 手札の ${handCount} 枚のカードを全て捨て、新たに ${drawCount} 枚ドロー！ APが1回復した！`;
                        break;
                    }
                    case 'recycle': {
                        const nonItemDiscards = nextDiscardPile.filter(c => c.type !== 'Item' && c.id !== '57' && c.id !== '119');
                        if (nonItemDiscards.length > 0) {
                            const pickedCard = nonItemDiscards[Math.floor(Math.random() * nonItemDiscards.length)];
                            nextDiscardPile = nextDiscardPile.filter(c => c !== pickedCard);
                            const reducedCard = {
                                ...pickedCard,
                                ap_cost: Math.max(0, (pickedCard.ap_cost ?? 1) - 1)
                            };
                            nextHand.push(reducedCard);
                            logMsg = `${card.name}を使用！ 捨て札から「${pickedCard.name}」を手札に戻した (コストが1減少)！`;
                        } else {
                            logMsg = `${card.name}を使用したが、捨て札に対象となるカードがなかった。`;
                        }
                        break;
                    }
                    case 'blood_pursuit': {
                        const hasBleed = loopTargetEnemy.status_effects?.some(e => e.id === 'bleed' || e.id === 'bleed_minor');
                        const basePower = (card.power ?? 20) * damageMultiplier;
                        const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                        const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                        const result = calculateDamageV4(basePower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, finalCritRate);
                        damage = result.damage;
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！${critLabel} ${damage} のダメージ！`;
                        if (hasBleed) {
                            nextHand.push(card);
                            logMsg += ` 対象が出血状態のため、カードが手札に返還された！`;
                        }
                        break;
                    }
                    case 'flame_burst': {
                        let burstLogs: string[] = [];
                        damage = 0;
                        currentEnemies = currentEnemies.map(e => {
                            if (e.hp <= 0) return e;
                            const hasBurn = e.status_effects?.some(se => se.id === 'burn');
                            const power = (hasBurn ? 30 : 15) * damageMultiplier;
                            const targetHasCritVul = e.status_effects?.some(se => se.id === 'crit_vulnerability' && se.duration > 0);
                            const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                            const result = calculateDamageV4(power, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk, finalCritRate);
                            const finalDmg = result.damage;
                            const newHp = Math.max(0, e.hp - finalDmg);
                            if (hasBurn) {
                                burstLogs.push(`${e.name}に爆発！ 炎上のため2倍の ${finalDmg} ダメージ！`);
                            } else {
                                burstLogs.push(`${e.name}に ${finalDmg} ダメージ！`);
                            }
                            return { ...e, hp: newHp };
                        });
                        logMsg = `${card.name}で全体爆撃！\n` + burstLogs.join('\n');
                        break;
                    }
                    case 'frozen_wave': {
                        let frozenLogs: string[] = [];
                        currentEnemies = currentEnemies.map(e => {
                            if (e.hp <= 0) return e;
                            const cleanedEffects = (e.status_effects || []).filter(se => NEGATIVE_EFFECTS.includes(se.id as StatusEffectId));
                            const finalEffects = applyEffect(cleanedEffects as StatusEffect[], 'bind', 2);
                            frozenLogs.push(`${e.name}の強化効果を解除し、凍結・拘束した！`);
                            return { ...e, status_effects: finalEffects };
                        });
                        logMsg = `${card.name}を使用！\n` + frozenLogs.join('\n');
                        break;
                    }
                    case 'iron_bastion': {
                        const defVal = card.effect_val || 35;
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'cover_all', 4);
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'def_up', 4, defVal);
                        logMsg = `${card.name}を展開！ 3ターンの間、パーティへの単体攻撃を肩代わりし、自身のDEFを+${defVal}した！`;
                        break;
                    }
                    case 'revenge_shield_card': {
                        const defVal = card.effect_val || 15;
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'def_up', 2, defVal);
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'revenge_shield', 2);
                        logMsg = `${card.name}を使用！ 1ターンの間、自身のDEFを+${defVal}し、受けたダメージの100%を物理反射する！`;
                        break;
                    }
                    case 'giant_body': {
                        const resolvedTargetId = targetId || getDefaultTarget(card, battleState);
                        if (resolvedTargetId === 'player') {
                            if (userProfile) {
                                if ((userProfile as any).giant_body_applied) {
                                    const newHp = Math.min(userProfile.max_hp || 100, (userProfile.hp || 0) + 50);
                                    set(state => ({
                                        userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                                    }));
                                    healSyncHp = newHp;
                                    const { selectedProfileId } = get();
                                    updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                                    logMsg = `${card.name}を自身に使用！ HPを50回復した！(最大HP上昇は既に適用済み)`;
                                } else {
                                    const newMaxHp = (userProfile.max_hp || 100) + 50;
                                    const newHp = Math.min(newMaxHp, (userProfile.hp || 0) + 50);
                                    set(state => ({
                                        userProfile: state.userProfile ? { ...state.userProfile, max_hp: newMaxHp, hp: newHp, giant_body_applied: true } : null
                                    }));
                                    healSyncHp = newHp;
                                    const { selectedProfileId } = get();
                                    updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                                    logMsg = `${card.name}を自身に使用！ 最大HPを戦闘終了まで+50し、HPを50回復した！`;
                                }
                            }
                        } else {
                            const party = [...(battleState.party || [])];
                            const idx = party.findIndex(m => String(m.id) === resolvedTargetId);
                            if (idx >= 0) {
                                const member = party[idx];
                                if ((member as any).giant_body_applied) {
                                    const maxDur = (member as any).max_hp || member.max_durability || member.durability || 100;
                                    const newDur = Math.min(maxDur, (member.durability ?? 0) + 50);
                                    party[idx] = {
                                        ...member,
                                        durability: newDur
                                    } as any;
                                    set(state => ({ battleState: { ...state.battleState, party } }));
                                    logMsg = `${card.name}を ${member.name} に使用！ HPを50回復した！(最大HP上昇は既に適用済み)`;
                                    newMessages.push(`__party_sync:${member.id}:${newDur}`);
                                } else {
                                    const currentMax = (member as any).max_hp || member.max_durability || 100;
                                    const newMax = currentMax + 50;
                                    const newDur = Math.min(newMax, (member.durability ?? 0) + 50);
                                    party[idx] = {
                                        ...member,
                                        max_hp: newMax,
                                        max_durability: newMax,
                                        durability: newDur,
                                        giant_body_applied: true
                                    } as any;
                                    set(state => ({ battleState: { ...state.battleState, party } }));
                                    logMsg = `${card.name}を ${member.name} に使用！ 最大HPを戦闘終了まで+50し、HPを50回復した！`;
                                    newMessages.push(`__party_sync:${member.id}:${newDur}`);
                                }
                            } else {
                                logMsg = `${card.name}を使用したが、対象の味方が見つからなかった。`;
                            }
                        }
                        break;
                    }
                    case 'grounding': {
                        const defVal = card.effect_val || 15;
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'stun_immune', 3);
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'def_up', 3, defVal);
                        logMsg = `${card.name}を使用！ 2ターンの間、スタン・拘束無効（スタン免疫）を付与し、DEFを+${defVal}した！`;
                        break;
                    }
                    case 'gambler_dice': {
                        const randomDmg = Math.floor((Math.floor(Math.random() * 120) + 1) * damageMultiplier);
                        const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                        const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                        const result = calculateDamageV4(randomDmg, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, finalCritRate);
                        damage = result.damage;
                        const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                        logMsg = `${loopTargetEnemy.name}に${card.name}！ 運命のダイスは「${Math.floor(randomDmg / damageMultiplier)}」！${critLabel} ${damage} の物理ダメージ！`;
                        break;
                    }
                    case 'soul_boost_card': {
                        const playerHp = userProfile?.hp || 0;
                        const selfDmg = Math.max(1, Math.floor(playerHp * 0.2));
                        const newHp = Math.max(0, playerHp - selfDmg);
                        set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                        healSyncHp = newHp;
                        const { selectedProfileId } = get();
                        updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'soul_boost', 99);
                        logMsg = `${card.name}を使用！ 現在HPの20%を自傷 (-${selfDmg} HP)！ 次に放つ物理・魔法カードの威力を2.5倍にするバフを得た！`;
                        break;
                    }
                    case 'ruin_pact': {
                        const otherHandCards = nextHand.filter(c => c.id !== card.id);
                        const count = otherHandCards.length;
                        nextHand = [];
                        if (count > 0) {
                            set(state => ({
                                battleState: {
                                    ...state.battleState,
                                    exhaustPile: [...state.battleState.exhaustPile, ...otherHandCards.map(c => ({ id: c.id, name: c.name, type: c.type }))]
                                }
                            }));
                            let logs: string[] = [];
                            for (let i = 0; i < count; i++) {
                                let alive = currentEnemies.filter(e => e.hp > 0);
                                if (alive.length === 0) break;
                                const picked = alive[Math.floor(Math.random() * alive.length)];
                                const targetHasCritVul = picked.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                                const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                                const result = calculateDamageV4(25 * damageMultiplier, picked.def || 0, currentPlayerEffects as StatusEffect[], picked.status_effects as StatusEffect[] || [], true, effectivePlayerAtk, finalCritRate);
                                currentEnemies = currentEnemies.map(e => e.id === picked.id ? { ...e, hp: Math.max(0, e.hp - result.damage) } : e);
                                logs.push(`${picked.name}に ${result.damage} ダメージ`);
                            }
                            damage = 0;
                            logMsg = `${card.name}！ 手札 ${count} 枚を除外し、破滅の魔弾をばら撒く！\n` + logs.join('\n');
                        } else {
                            logMsg = `${card.name}を使用したが、手札に他のカードがなかった。`;
                        }
                        break;
                    }
                    case 'element_resonance_card': {
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'element_resonance', 99);
                        logMsg = `${card.name}！ エレメンタルの共鳴を得た。次に使用する魔法(Magic)の属性に応じた全体バフが発動する！`;
                        break;
                    }
                    case 'plasma_shower': {
                        damage = (card.power ?? 30) * damageMultiplier;
                        const result = calculateDamageV4(damage, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        damage = result.damage;
                        isAoe = true;
                        logMsg = `${card.name}を発動！ 雷雨が降り注ぎ、敵全体に ${damage} のダメージ！`;
                        currentEnemies = currentEnemies.map(e => {
                            if (e.hp <= 0) return e;
                            const newHp = Math.max(0, e.hp - damage);
                            let newEffects = (e.status_effects || []) as StatusEffect[];
                            if (newHp > 0 && Math.random() < 0.15) {
                                newEffects = applyEffect(newEffects, 'stun', 2);
                                newMessages.push(`→ ${e.name}は感電してスタンした！`);
                            }
                            return { ...e, hp: newHp, status_effects: newEffects };
                        });
                        damage = 0;
                        break;
                    }
                    case 'absolute_zero': {
                        damage = (card.power ?? 25) * damageMultiplier;
                        const result = calculateDamageV4(damage, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        damage = result.damage;
                        isAoe = true;
                        logMsg = `${card.name}を発動！ 氷の嵐が敵全体に ${damage} のダメージ！`;
                        currentEnemies = currentEnemies.map(e => {
                            if (e.hp <= 0) return e;
                            const newHp = Math.max(0, e.hp - damage);
                            const newEffects = applyEffect((e.status_effects || []) as StatusEffect[], 'crit_vulnerability', 2);
                            return { ...e, hp: newHp, status_effects: newEffects };
                        });
                        damage = 0;
                        break;
                    }
                    case 'fire_wave': {
                        damage = (card.power ?? 20) * damageMultiplier;
                        const result = calculateDamageV4(damage, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                        damage = result.damage;
                        isAoe = true;
                        logMsg = `${card.name}で烈火の波！ 敵全体に ${damage} のダメージ！`;
                        currentEnemies = currentEnemies.map(e => {
                            if (e.hp <= 0) return e;
                            const newHp = Math.max(0, e.hp - damage);
                            let newEffects = (e.status_effects || []) as StatusEffect[];
                            const burnEffect = newEffects.find(se => se.id === 'burn');
                            if (burnEffect) {
                                newEffects = newEffects.map(se => se.id === 'burn' ? { ...se, duration: se.duration + 1 } : se);
                                newMessages.push(`→ ${e.name}の炎上ターンが1ターン延長された！`);
                            }
                            return { ...e, hp: newHp, status_effects: newEffects };
                        });
                        damage = 0;
                        break;
                    }
                    case 'quick_draw': {
                        const deck = get().deck;
                        const drawCount = Math.min(2, deck.length);
                        const drawn: typeof nextHand = [];
                        const remainingDeck = [...deck];
                        for (let draw = 0; draw < drawCount; draw++) {
                            if (remainingDeck.length === 0) break;
                            drawn.push(remainingDeck.shift()!);
                        }
                        nextHand = [...nextHand, ...drawn];
                        set({ deck: remainingDeck });
                        logMsg = `${card.name}を使用！ 山札から ${drawCount} 枚ドロー！`;
                        const isFirstCard = (battleState.cardsPlayedThisTurn || 0) <= 1;
                        if (isFirstCard) {
                            const newAp = Math.min(15, battleState.current_ap + 1);
                            set(state => ({ battleState: { ...state.battleState, current_ap: newAp } }));
                            logMsg += ` さらにこのターン最初のカードプレイのため、APが1回復した！`;
                        }
                        break;
                    }
                    case 'tactical_plan': {
                        const deck = get().deck;
                        const drawn = deck.slice(0, 3);
                        if (drawn.length > 0) {
                            const picked = drawn[Math.floor(Math.random() * drawn.length)];
                            nextHand.push(picked);
                            const remainingDeck = deck.filter(c => c !== picked);
                            set({ deck: remainingDeck });
                            logMsg = `${card.name}を使用！ デッキの上の3枚から「${picked.name}」を手札に加え、残りを山札に戻した。`;
                        } else {
                            logMsg = `${card.name}を使用したが、山札にカードがなかった。`;
                        }
                        break;
                    }
                    case 'time_reverse': {
                        const lastPlayedCard = nextDiscardPile[nextDiscardPile.length - 1];
                        if (lastPlayedCard) {
                            nextDiscardPile = nextDiscardPile.slice(0, -1);
                            const halvedCard = {
                                ...lastPlayedCard,
                                ap_cost: Math.floor((lastPlayedCard.ap_cost ?? 1) / 2)
                            };
                            nextHand.push(halvedCard);
                            logMsg = `${card.name}を使用！ 直前に使用した「${lastPlayedCard.name}」を手札に戻し、そのAPコストを半分にした！`;
                        } else {
                            logMsg = `${card.name}を使用したが、直前にプレイしたカードが見つからなかった。`;
                        }
                        break;
                    }
                    case 'mana_filter': {
                        const discardable = nextHand.filter(c => c.id !== card.id && (c.type === 'Support' || c.type === 'Magic'));
                        if (discardable.length > 0) {
                            const picked = discardable[Math.floor(Math.random() * discardable.length)];
                            nextHand = nextHand.filter(c => c.id !== picked.id);
                            nextDiscardPile = [...nextDiscardPile, picked];
                            const newAp = Math.min(15, battleState.current_ap + 3);
                            set(state => ({ battleState: { ...state.battleState, current_ap: newAp } }));
                            logMsg = `${card.name}を使用！ 手札の「${picked.name}」を捨て、APを3回復した！`;
                        } else {
                            logMsg = `${card.name}を使用したが、手札に捨てる対象（魔法・サポート）となるカードがなかった。`;
                        }
                        break;
                    }
                    case 'heal': {
                        const healAmount = (card as any).effect_val ?? card.power ?? 20;
                        const cardTargetType = (targetId && targetId !== 'player') ? 'single_ally' : (card.target_type || 'self');
                        const resolvedTargetId = targetId || getDefaultTarget(card, battleState);

                        if (cardTargetType === 'single_ally' && resolvedTargetId && resolvedTargetId !== 'player') {
                            const party = [...(battleState.party || [])];
                            const idx = party.findIndex(m => String(m.id) === resolvedTargetId);
                            if (idx >= 0 && healAmount > 0) {
                                const member = party[idx];
                                const maxDur = (member as any).max_hp || member.max_durability || member.durability || 100;
                                const curDur = member.durability ?? 0;
                                const healed = Math.min(healAmount, maxDur - curDur);
                                const newDur = curDur + healed;

                                // Apply status effect if present (気の癒やし等のリジェネ付与用)
                                let newEffects = [...(member.status_effects || [])];
                                if (effectInfo.effectId) {
                                    const dur = effectInfo.effectDuration || 3;
                                    const finalDuration = isTurnEndTickCompensated(effectInfo.effectId) ? dur + 1 : dur;
                                    newEffects = applyEffect(newEffects as StatusEffect[], effectInfo.effectId, finalDuration);
                                }

                                party[idx] = { ...member, durability: newDur, status_effects: newEffects };
                                logMsg = `♥ ${card.name}で ${member.name}のHP +${healed} 回復！ (${newDur}/${maxDur})`;
                                if (effectInfo.effectId) {
                                    logMsg += `、${getEffectName(effectInfo.effectId)}を付与！`;
                                }
                                newMessages.push(`__party_sync:${member.id}:${newDur}`);
                                set(state => ({
                                    battleState: {
                                        ...state.battleState,
                                        party
                                    }
                                }));
                            } else {
                                logMsg = `${card.name}を使用！(対象の体力は満たんでいる)`;
                            }
                        } else if (cardTargetType === 'all_allies') {
                            const healMsgs: string[] = [];
                            if (userProfile && healAmount > 0) {
                                const maxHp = effectivePlayerMaxHp;
                                const prevHp2 = userProfile.hp || 0;
                                const newHp = Math.min(maxHp, prevHp2 + healAmount);

                                // Apply status effect to player
                                if (effectInfo.effectId) {
                                    const dur = effectInfo.effectDuration || 3;
                                    const finalDuration = isTurnEndTickCompensated(effectInfo.effectId) ? dur + 1 : dur;
                                    currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, finalDuration);
                                }

                                set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                                healSyncHp = newHp;
                                let msg = `♥ ${card.name}で あなたのHP +${newHp - prevHp2} 回復！ (${newHp}/${maxHp})`;
                                if (effectInfo.effectId) {
                                    msg += `、${getEffectName(effectInfo.effectId)}を付与！`;
                                }
                                healMsgs.push(msg);
                                const { selectedProfileId } = get();
                                updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                            }
                            const party = [...(battleState.party || [])];
                            for (let pi = 0; pi < party.length; pi++) {
                                const m = party[pi];
                                if (!m.is_active || (m.durability ?? 0) <= 0) continue;
                                const maxDur = (m as any).max_hp || m.max_durability || m.durability || 100;
                                const curDur = m.durability ?? 0;

                                // Apply status effect to party member
                                let newEffects = [...(m.status_effects || [])];
                                if (effectInfo.effectId) {
                                    const dur = effectInfo.effectDuration || 3;
                                    const finalDuration = isTurnEndTickCompensated(effectInfo.effectId) ? dur + 1 : dur;
                                    newEffects = applyEffect(newEffects as StatusEffect[], effectInfo.effectId, finalDuration);
                                }

                                if (curDur >= maxDur) {
                                    if (effectInfo.effectId) {
                                        party[pi] = { ...m, status_effects: newEffects };
                                        healMsgs.push(`♥ ${m.name}に ${getEffectName(effectInfo.effectId)} を付与！`);
                                    }
                                    continue;
                                }
                                const healed = Math.min(healAmount, maxDur - curDur);
                                const newDur = curDur + healed;
                                party[pi] = { ...m, durability: newDur, status_effects: newEffects };
                                let msg = `♥ ${m.name}のHP +${healed} 回復！ (${newDur}/${maxDur})`;
                                if (effectInfo.effectId) {
                                    msg += `、${getEffectName(effectInfo.effectId)}を付与！`;
                                }
                                healMsgs.push(msg);
                                healMsgs.push(`__party_sync:${m.id}:${newDur}`);
                            }
                            if (party.length > 0) {
                                set(state => ({ battleState: { ...state.battleState, party } }));
                            }
                            logMsg = healMsgs.length > 0 ? healMsgs[0] : `${card.name}を使用！`;
                            if (healMsgs.length > 1) {
                                const extraMsgs = healMsgs.slice(1);
                                newMessages.push(...extraMsgs);
                            }
                        } else {
                            if (userProfile && healAmount > 0) {
                                const maxHp = effectivePlayerMaxHp;
                                const newHp = Math.min(maxHp, (userProfile.hp || 0) + healAmount);

                                // Apply status effect to self
                                if (effectInfo.effectId) {
                                    const dur = effectInfo.effectDuration || 3;
                                    const finalDuration = isTurnEndTickCompensated(effectInfo.effectId) ? dur + 1 : dur;
                                    currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, finalDuration);
                                }

                                set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                                logMsg = `♥ ${card.name}で HP +${healAmount} 回復！ (${newHp}/${maxHp})`;
                                if (effectInfo.effectId) {
                                    logMsg += `、${getEffectName(effectInfo.effectId)}を付与！`;
                                }
                                healSyncHp = newHp;
                                const { selectedProfileId } = get();
                                updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                            } else {
                                logMsg = `${card.name}を使用！(体力は満たんでいる)`;
                                if (effectInfo.effectId) {
                                    const dur = effectInfo.effectDuration || 3;
                                    const finalDuration = isTurnEndTickCompensated(effectInfo.effectId) ? dur + 1 : dur;
                                    currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, finalDuration);
                                    logMsg += `、${getEffectName(effectInfo.effectId)}を付与！`;
                                }
                            }
                        }
                        break;
                    }
                    case 'escape': {
                        nextHand = nextHand.filter(c => c.id !== card.id);
                        nextDiscardPile = [...nextDiscardPile, card];
                        logMsg = `${card.name}を使用！ 戦闘から離脱した！`;
                        soundManager?.playSE('se_escape');
                        set(state => ({
                            hand: nextHand,
                            discardPile: nextDiscardPile,
                            battleState: { ...state.battleState, isDefeat: true, battle_result: 'escape', messages: [...newMessages, logMsg] }
                        }));
                        return true;
                    }
                    case 'buff_self': {
                        if (effectInfo.effectId) {
                            const defValue = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                                ? (effectInfo.defValue ?? card.power ?? 10) : undefined;
                            currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3, defValue);
                            logMsg = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                                ? `${card.name}を使用！ DEF +${defValue} (${effectInfo.effectDuration || 3}T)！`
                                : `${card.name}を使用！ ${getEffectName(effectInfo.effectId)}を得た！`;
                        } else { logMsg = `${card.name}を使用！`; }
                        break;
                    }
                    case 'taunt': {
                        if (effectInfo.effectId) {
                            currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 2);
                        }
                        logMsg = `${card.name}を使用！ 敵の攻撃を引きつけた！`;
                        break;
                    }
                    case 'buff_party': {
                        if (effectInfo.effectId) {
                            const defValue = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy' || effectInfo.effectId === 'barrier')
                                ? (effectInfo.defValue ?? 0) : undefined;
                            currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3, defValue);
                            
                            const newParty = (battleState.party || []).map(m => {
                                if (!m.is_active || (m.durability ?? 0) <= 0) return m;
                                return {
                                    ...m,
                                    status_effects: applyEffect((m.status_effects || []) as StatusEffect[], effectInfo!.effectId!, effectInfo!.effectDuration || 3, defValue)
                                };
                            });

                            set(state => ({ battleState: { ...state.battleState, party: newParty } }));
                            logMsg = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy' || effectInfo.effectId === 'barrier')
                                ? `${card.name}を展開！ パーティ全体のDEF +${defValue} (${effectInfo.effectDuration || 3}T)！`
                                : `${card.name}を展開！ パーティ全体が守られた！`;
                        }
                        break;
                    }
                    case 'aoe_attack': {
                        damage = card.power ?? 0;
                        if (damage > 0) {
                            const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic');
                            const result = calculateDamageV4(damage, 0, currentPlayerEffects as StatusEffect[], [], isMagic, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                            damage = result.damage;
                            const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                            logMsg = `${card.name}で全体攻撃！${critLabel} 各敵に ${damage} のダメージ！`;
                        } else {
                            logMsg = `${card.name}で全体攻撃！`;
                        }
                        isAoe = true;
                        break;
                    }
                    case 'debuff_enemy': {
                        damage = card.power ?? 0;
                        if (damage > 0) {
                            damage = calculateDamage(damage, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], true, effectivePlayerAtk);
                            logMsg = `${loopTargetEnemy.name}に${card.name}！ ${damage} ダメージ！`;
                        } else {
                            const eName = effectInfo.effectId ? getEffectName(effectInfo.effectId) : card.name;
                            logMsg = `${loopTargetEnemy.name}に${card.name}を使用！ ${eName}を付与！`;
                        }
                        if (card.target_type === 'all_enemies' || effectInfo.target_type === 'all_enemies') {
                            isAoe = true;
                            const pwr = card.power && card.power > 0 ? `(${card.power}%)` : '';
                            logMsg = `敵全体に${card.name}を使用！ ${effectInfo.effectId ? getEffectName(effectInfo.effectId) + pwr : ''}を付与！`;
                        }
                        break;
                    }
                    case 'instakill': {
                        if (loopTargetEnemy.death_immune) {
                            const fallbackPower = Math.max(card.power || 0, effectivePlayerAtk + 10);
                            const result = calculateDamageV4(fallbackPower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                            damage = result.damage;
                            const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                            logMsg = `${loopTargetEnemy.name}に${card.name}を使用！ 即死を無効化されたが、${critLabel}${damage} のダメージ！`;
                        } else if (Math.random() < 0.3) {
                            damage = loopTargetEnemy.hp;
                            logMsg = `${loopTargetEnemy.name}に${card.name}を使用！ 致命的な一撃が決まった！`;
                        } else {
                            const fallbackPower = Math.max(card.power || 0, effectivePlayerAtk + 10);
                            const result = calculateDamageV4(fallbackPower, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk, BATTLE_RULES.PLAYER_CRIT_RATE);
                            damage = result.damage;
                            const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                            logMsg = `${loopTargetEnemy.name}に${card.name}を使用！ 即死には失敗したが、${critLabel}${damage} のダメージ！`;
                        }
                        break;
                    }
                    case 'pierce_attack': {
                        damage = card.power ?? 0;
                        if (damage > 0) {
                            damage = calculateDamage(damage, 0, currentPlayerEffects as StatusEffect[], [], true, effectivePlayerAtk);
                            logMsg = `${loopTargetEnemy.name}に${card.name}を使用！ 防御を貫通して ${damage} のダメージ！`;
                        } else {
                            logMsg = `${card.name}を使用！`;
                        }
                        break;
                    }
                    case 'multi_attack': {
                        damage = (card.power ?? 0) * 2;
                        if (damage > 0) {
                            damage = calculateDamage(damage, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk);
                            logMsg = `${loopTargetEnemy.name}に${card.name}を使用！ 怒涛の連撃で ${damage} のダメージ！`;
                        } else {
                            logMsg = `${card.name}を使用！`;
                        }
                        break;
                    }
                    case 'recoil_attack': {
                        damage = card.power ?? 0;
                        if (damage > 0) {
                            damage = calculateDamage(damage, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], false, effectivePlayerAtk);
                            logMsg = `${card.name}を使用！ 敵全体に ${damage} のダメージ！`;
                            isAoe = true;
                            
                            const recoil = Math.floor(damage * 0.2); 
                            const currentHp = get().userProfile?.hp || 0;
                            const newHp = Math.max(0, currentHp - recoil);
                            set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                            logMsg += ` (反動ダメージ -${recoil})`;
                            healSyncHp = newHp;
                        } else {
                            logMsg = `${card.name}を使用！`;
                        }
                        break;
                    }
                    case 'cure_self': {
                        const healAmount = (card as any).effect_val ?? card.power ?? 0;
                        let healMsg = '';
                        if (userProfile && healAmount > 0) {
                            const maxHp = effectivePlayerMaxHp;
                            const newHp = Math.min(maxHp, (userProfile.hp || 0) + healAmount);
                            set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                            healMsg = ` HP +${healAmount} 回復！ (${newHp}/${maxHp}) 及び`;
                            healSyncHp = newHp;
                            const { selectedProfileId } = get();
                            updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                        }

                        if (effectInfo.cureType === 'status') {
                            const statusAilments: string[] = ['poison', 'burn', 'stun', 'bind', 'bleed', 'bleed_minor', 'fear', 'blind', 'blind_minor', 'freeze', 'curse'];
                            currentPlayerEffects = currentPlayerEffects.filter(e => !statusAilments.includes(e.id));
                            logMsg = `${card.name}を使用！${healMsg}状態異常を回復した！`;
                        } else if (effectInfo.cureType === 'debuff') {
                            currentPlayerEffects = currentPlayerEffects.filter(e => !['atk_down', 'def_down'].includes(e.id));
                            logMsg = `${card.name}を使用！${healMsg}デバフを解除した！`;
                        } else {
                            const statusAilments: string[] = ['poison', 'burn', 'stun', 'bind', 'bleed', 'bleed_minor', 'fear', 'blind', 'blind_minor', 'freeze', 'curse', 'atk_down', 'def_down'];
                            currentPlayerEffects = currentPlayerEffects.filter(e => !statusAilments.includes(e.id));
                            logMsg = `${card.name}を使用！${healMsg}状態を正常に戻した！`;
                        }
                        break;
                    }
                    case 'support_activate': {
                        const passiveLabel = getPassiveLabel(card.id);
                        if (!currentActiveSupportBuffs.includes(card.id)) {
                            currentActiveSupportBuffs.push(card.id);
                        }
                        if (effectInfo.effectId === 'berserk') {
                            currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], 'atk_up' as StatusEffectId, effectInfo.effectDuration || 3);
                            logMsg = `⚠ ${card.name}を服用！ ATK×2.0 だがDEF半減（${effectInfo.effectDuration || 3}T）`;
                        } else if (effectInfo.effectId === 'ap_recover' as any) {
                            const newAp = Math.min(15, battleState.current_ap + 3);
                            set(state => ({ battleState: { ...state.battleState, current_ap: newAp } }));
                            logMsg = `✨ ${card.name}を使用！ APが3回復した（現在: ${newAp}）`;
                        } else if (effectInfo.effectId === 'ap_max' as any) {
                            const newAp = 15;
                            const maxHp = effectivePlayerMaxHp;
                            const selfDmg = Math.max(1, Math.floor(maxHp * 0.1));
                            const currentHp = get().userProfile?.hp || 0;
                            const newHp = Math.max(0, currentHp - selfDmg);
                            
                            set(state => ({ 
                                userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                                battleState: { ...state.battleState, current_ap: newAp } 
                            }));
                            
                            logMsg = `✨ ${card.name}を発動！ AP全回復！ (自傷ダメージ -${selfDmg})`;
                            healSyncHp = newHp;
                            const { selectedProfileId } = get();
                            updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || selectedProfileId);
                        } else if (effectInfo.effectId) {
                            currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3);
                            logMsg = `✨ ${card.name}を発動！ ${getEffectName(effectInfo.effectId)}(${effectInfo.effectDuration || 3}T) ${passiveLabel}`;
                        } else {
                            logMsg = `✨ ${card.name}を発動！ ${passiveLabel}（バトル終了まで）`;
                        }
                        break;
                    }
                    default: {
                        damage = (card.power ?? 0) * damageMultiplier;
                        if (damage > 0) {
                            const isMagic = card.type === 'Magic' || card.name.includes('魔法') || card.name.toLowerCase().includes('magic') || card.name.toLowerCase().includes('fire');
                            const targetHasCritVul = loopTargetEnemy.status_effects?.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
                            const finalCritRate = targetHasCritVul ? BATTLE_RULES.PLAYER_CRIT_RATE + 0.15 : BATTLE_RULES.PLAYER_CRIT_RATE;
                            const result = calculateDamageV4(damage, loopTargetEnemy.def || 0, currentPlayerEffects as StatusEffect[], loopTargetEnemy.status_effects as StatusEffect[] || [], isMagic, effectivePlayerAtk, finalCritRate);
                            damage = result.damage;
                            const critLabel = result.isCritical ? ' クリティカルヒット！' : '';
                            logMsg = `${loopTargetEnemy.name}に${card.name}を使用！${critLabel} ${damage} のダメージ！`;
                        } else { logMsg = `${card.name}を使用！`; }
                        break;
                    }
                }

                if (loop === 0) {
                    nextHand = nextHand.filter(c => c.id !== card.id);
                    if ((card.type === 'Item' && (card as any).isEquipment) || card.cost_type === 'item' || card.type === 'Support') {
                        currentExhaustPile.push({ id: card.id, name: card.name, type: card.type });
                        currentConsumedItems.push(card.id);
                    } else {
                        nextDiscardPile = [...nextDiscardPile, card];
                    }
                }

                if (!effectInfo.skipDamage && effectInfo.effectId) {
                    const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(effectInfo.effectId);
                    if (isSelfBuff) {
                        const dur = effectInfo.effectDuration || 3;
                        const finalDuration = isTurnEndTickCompensated(effectInfo.effectId) ? dur + 1 : dur;
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectInfo.effectId, finalDuration);
                    }
                    if (effectInfo.effectId === 'stun' && (card.id.match(/^(\d+)/)?.[1] ?? card.id) === '1') {
                        if (Math.random() < 0.10) {
                            if (loopTargetEnemy) {
                                const stunEffects = applyEffect((loopTargetEnemy.status_effects || []) as StatusEffect[], 'stun' as StatusEffectId, 2);
                                loopTargetEnemy.status_effects = stunEffects;
                                currentEnemies = currentEnemies.map(e => e.id === loopTargetEnemyId ? { ...e, status_effects: stunEffects } : e);
                                newMessages.push(`✨ ${card.name}の衝撃でスタン！`);
                            }
                        }
                    }
                }

                if (card.effect_id && !effectInfo.effectId) {
                    const effectId = card.effect_id as StatusEffectId;
                    const duration = card.effect_duration || 3;
                    const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(effectId);
                    if (isSelfBuff) {
                        const finalDuration = isTurnEndTickCompensated(effectId) ? duration + 1 : duration;
                        currentPlayerEffects = applyEffect(currentPlayerEffects as StatusEffect[], effectId, finalDuration);
                    }
                }

                let resistedDebuff: string | null = null;
                const resistedEnemies: string[] = [];
                const affectedEnemies: string[] = [];
                currentEnemies = currentEnemies.map(e => {
                    if (isAoe && e.hp > 0) {
                        let newHp = Math.max(0, e.hp - damage);
                        let newEffects = (e.status_effects || []) as StatusEffect[];
                        if (effectInfo?.effectId) {
                            const isSelfBuff = isSelfBuffEffect(effectInfo.effectId);
                            if (!isSelfBuff) {
                                if (rollDebuffSuccess(effectInfo.effectId)) {
                                    const dur = effectInfo?.effectDuration || 3;
                                    const aoeDuration = isTurnEndTickCompensated(effectInfo.effectId) ? dur + 1 : dur;
                                    newEffects = applyEffect(newEffects, effectInfo.effectId, aoeDuration);
                                    affectedEnemies.push(e.name);
                                } else {
                                    resistedEnemies.push(e.name);
                                }
                            }
                        }
                        return { ...e, hp: newHp, status_effects: newEffects };
                    }
                    if (e.id === loopTargetEnemyId) {
                        let newHp = Math.max(0, e.hp - damage);
                        let newEffects = customTargetEffects !== null ? customTargetEffects : ((e.status_effects || []) as StatusEffect[]);
                        const resolvedEffectId = effectInfo?.effectId || (card?.effect_id as StatusEffectId | undefined);
                        if (resolvedEffectId && isValidEffectId(resolvedEffectId)) {
                            const isSelfBuff = isSelfBuffEffect(resolvedEffectId);
                            if (!isSelfBuff) {
                                if (rollDebuffSuccess(resolvedEffectId)) {
                                    const baseDuration = effectInfo?.effectDuration || card?.effect_duration || 3;
                                    const finalDuration = isTurnEndTickCompensated(resolvedEffectId) ? baseDuration + 1 : baseDuration;
                                    newEffects = applyEffect(newEffects, resolvedEffectId, finalDuration);
                                } else {
                                    resistedDebuff = resolvedEffectId;
                                }
                            }
                        }
                        return { ...e, hp: newHp, status_effects: newEffects };
                    }
                    return e;
                });

                const updatedTargetEnemy = currentEnemies.find(e => e.id === loopTargetEnemyId);
                const loopIsTargetDead = updatedTargetEnemy ? updatedTargetEnemy.hp <= 0 : false;
                const loopAllDead = currentEnemies.every(e => e.hp <= 0);

                newMessages.push(logMsg);
                if (healSyncHp !== null) newMessages.push(`__hp_sync:${healSyncHp}`);
                if (damage > 0) {
                    const resolvedEffectIdForDrain = effectInfo?.effectId || (card?.effect_id as string | undefined);
                    if (resolvedEffectIdForDrain === 'drain') {
                        const drainHeal = Math.floor(damage * 0.5);
                        const currentHp = get().userProfile?.hp || 0;
                        const maxHp = effectivePlayerMaxHp;
                        const newHp = Math.min(maxHp, currentHp + drainHeal);
                        set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                        newMessages.push(`→ 生命力を吸収！ HP +${drainHeal} 回復！`);
                        updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || null);
                    }
                }

                {
                    const resolvedEffectIdForLog = effectInfo?.effectId || (card?.effect_id as string | undefined);
                    if (resolvedEffectIdForLog && isValidEffectId(resolvedEffectIdForLog) && !['atk_up', 'def_up', 'def_up_heavy', 'regen', 'stun_immune', 'evasion_up', 'absolute_def', 'invulnerable', 'taunt_100', 'atk_up_fatal', 'morale_up', 'spd_up', 'counter'].includes(resolvedEffectIdForLog)) {
                        if (isAoe) {
                            affectedEnemies.forEach(name => {
                                newMessages.push(`→ ${name}に「${getEffectName(resolvedEffectIdForLog as any)}」を付与した！`);
                            });
                            resistedEnemies.forEach(name => {
                                newMessages.push(`→ ${name}は「${getEffectName(resolvedEffectIdForLog as any)}」に抵抗した！`);
                            });
                        } else {
                            if (resistedDebuff === resolvedEffectIdForLog) {
                                newMessages.push(`→ ${loopTargetEnemy?.name}は「${getEffectName(resolvedEffectIdForLog as any)}」に抵抗した！`);
                            } else if (damage > 0 || effectInfo?.effectType === 'debuff_enemy') {
                                newMessages.push(`→ ${loopTargetEnemy?.name}に「${getEffectName(resolvedEffectIdForLog as any)}」を付与した！`);
                            }
                        }
                    }
                }

                if (loopIsTargetDead) {
                    newMessages.push(`${loopTargetEnemy.name}を倒した！`);
                    if (updatedTargetEnemy?.drop_rate && updatedTargetEnemy.drop_item_slug && Math.random() * 100 < updatedTargetEnemy.drop_rate) {
                        newMessages.push(`${updatedTargetEnemy.name}が「${updatedTargetEnemy.drop_item_slug}」を落とした！`);
                        const dropSlug = updatedTargetEnemy.drop_item_slug;
                        set(state => ({
                            battleState: {
                                ...state.battleState,
                                droppedItems: [
                                    ...(state.battleState.droppedItems || []),
                                    { itemId: dropSlug, itemName: dropSlug, quantity: 1 }
                                ]
                            }
                        }));
                    }
                }

                if (loopAllDead) {
                    newMessages.push('全ての敵を倒した！ 勝利！');
                    try {
                        getAuthHeaders().then(authHeaders => {
                            const headers = {
                                'Content-Type': 'application/json',
                                ...authHeaders
                            };
                            fetch('/api/report-action', {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({ action: 'victory', impacts: selectedScenario?.impacts, scenario_id: selectedScenario?.id })
                            });
                            if (battleState.battle_session_id) {
                                fetch('/api/battle/validate-result', {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({
                                        battle_session_id: battleState.battle_session_id,
                                        claimed_result: 'victory'
                                    })
                                }).then(res => res.json()).then(data => {
                                    if (data.battle_completion_token) {
                                        set(state => ({
                                            battleState: { ...state.battleState, battle_completion_token: data.battle_completion_token }
                                        }));
                                    }
                                }).catch(console.error);
                            }
                        });
                        const preservedHp = get().userProfile?.hp;
                        const preservedVit = get().userProfile?.vitality;
                        if (preservedHp != null) {
                            const updateBody: any = { hp: Math.max(0, preservedHp) };
                            if (preservedVit != null) updateBody.vitality = preservedVit;
                            updateProfileStatusHelper(updateBody, get().userProfile?.id || null);
                        }
                        get().fetchWorldState();
                        get().fetchUserProfile().then(() => {
                            if (preservedHp != null) {
                                set(state => ({
                                    userProfile: state.userProfile
                                        ? { ...state.userProfile, hp: preservedHp, vitality: preservedVit ?? state.userProfile.vitality }
                                        : state.userProfile
                                }));
                            }
                        });
                        const partyCount = (get().battleState.party?.length || 0) + 1;
                        const gold = selectedScenario?.reward_gold || 50;
                        get().addGold(Math.floor(gold / partyCount));
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        const consumed = (get().battleState.consumedItems || []).filter(cid => uuidRegex.test(cid));
                        if (consumed.length > 0) {
                            getAuthHeaders().then(authHeaders => {
                                const headers = {
                                    'Content-Type': 'application/json',
                                    ...authHeaders
                                };
                                Promise.all(consumed.map(async (cid) => {
                                    try {
                                        const res = await fetch('/api/battle/use-item', {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify({ inventory_id: cid })
                                        });
                                        if (!res.ok) console.error('Failed to use item API:', cid, await res.text());
                                    } catch (err) {
                                        console.error('Failed to call use-item API:', cid, err);
                                    }
                                }));
                            });
                        }
                    } catch (e) { console.error(e); }
                    allDead = true;
                    break;
                }
            }
        }

        const finalTargetEnemyId = (targetId && currentEnemies.some(e => e.id === targetId)) ? targetId : battleState.enemy?.id;
        const finalTargetEnemy = currentEnemies.find(e => e.id === finalTargetEnemyId);
        const isTargetDead = finalTargetEnemy ? finalTargetEnemy.hp <= 0 : false;
        const finalAllDead = currentEnemies.every(e => e.hp <= 0);

        set(state => ({
            hand: nextHand,
            discardPile: nextDiscardPile,
            battleState: {
                ...state.battleState,
                player_effects: currentPlayerEffects,
                consumedItems: currentConsumedItems,
                exhaustPile: currentExhaustPile,
                activeSupportBuffs: currentActiveSupportBuffs,
                enemies: currentEnemies,
                enemy: isTargetDead ? (currentEnemies.find(e => e.hp > 0) || null) : finalTargetEnemy || null,
                messages: newMessages,
                isVictory: finalAllDead || state.battleState.isVictory
            }
        }));
        return true;
    },


    processPartyTurn: async () => {
        const initialBattle = get().battleState;
        if (initialBattle.isVictory || initialBattle.isDefeat || !initialBattle.enemy) return;

        let party = [...initialBattle.party];

        const membersNeedingDeck = party.filter(p =>
            p.is_active &&
            (p.durability ?? 100) > 0 &&
            (!p.signature_deck || p.signature_deck.length === 0) &&
            p.inject_cards && p.inject_cards.length > 0
        );

        if (membersNeedingDeck.length > 0) {
            const allIds = [...new Set(membersNeedingDeck.flatMap(p => p.inject_cards!.map(String)))];
            const { data: dbCards } = await supabase.from('cards').select('*').in('id', allIds);
            if (dbCards) {
                party = party.map(pm => {
                    if (!pm.inject_cards || pm.inject_cards.length === 0) return pm;
                    if (pm.signature_deck && pm.signature_deck.length > 0) return pm;
                    const resolved = pm.inject_cards
                        .map(id => dbCards.find(c => String(c.id) === String(id)))
                        .filter(Boolean)
                        .map(c => ({
                            id: String(c!.id), slug: c!.slug, name: c!.name, type: c!.type,
                            description: c!.description || '', cost: 0, // v28: 旧cost_val廃止
                            power: c!.effect_val ?? c!.power ?? 0, ap_cost: c!.ap_cost ?? 1,
                            effect_id: c!.effect_id ?? undefined, effect_duration: c!.effect_duration ?? undefined,
                            image_url: c!.image_url ?? undefined,
                        })) as Card[];
                    console.log(`[processPartyTurn] ${pm.name} deck restored: ${resolved.length} cards`);
                    return { ...pm, signature_deck: resolved, ai_role: determineRole({ ...pm, signature_deck: resolved }), ai_grade: determineGrade(pm), current_ap: pm.current_ap ?? 5, used_this_turn: [], lastUsedCardId: (pm as any).lastUsedCardId } as any;
                });
            }
        }

        const freshBattle = get().battleState;
        if (freshBattle.isVictory || freshBattle.isDefeat || !freshBattle.enemy) return;

        let newMessages = [...freshBattle.messages];
        // v2.8: Track all enemy HPs for mid-turn retargeting
        let trackedEnemies = [...(freshBattle.enemies || [])].map(e => ({ ...e }));
        let currentTargetId = freshBattle.enemy?.id;
        let enemyHp = freshBattle.enemy.hp;
        let enemyDef = freshBattle.enemy.def || 0;
        // v2.7: エネミー名を複数ソースからフォールバックして確定
        let resolvedEnemyName: string =
            (freshBattle.enemy?.name && freshBattle.enemy.name !== '') ?
            freshBattle.enemy.name :
            (freshBattle.enemies?.find(e => e.hp > 0)?.name || '敵');
        const updatedParty = [...party];
        let currentPlayerEffects = [...(freshBattle.player_effects || [])] as StatusEffect[];

        for (let i = 0; i < updatedParty.length; i++) {
            // v2.8: Skip if all enemies already dead
            if (trackedEnemies.every(e => e.hp <= 0)) break;

            let member = { ...updatedParty[i] };
            if (!member.is_active || (member.durability ?? 100) <= 0) continue;

            member.used_this_turn = [];

            // 味方NPCのスタン・拘束・凍結チェック (Bug F & G)
            const memberEffects = (member.status_effects || []) as StatusEffect[];
            if (isStunned(memberEffects)) {
                newMessages.push(`${member.name}は行動不能状態で行動できない！`);
                updatedParty[i] = member;
                continue;
            }

            const targetEnemy = freshBattle.enemies.find(e => e.id === currentTargetId);
            const enemyEffects = targetEnemy ? targetEnemy.status_effects : [];
            const context: BattleContext = {
                playerHp: get().userProfile?.hp || 0,
                playerMaxHp: getEffectiveMaxHp(get().userProfile, get()),
                enemyHp,
                enemyDef,
                enemyName: resolvedEnemyName,
                partyMembers: updatedParty,
                playerEffects: currentPlayerEffects, // 最新のプレイヤー状態を連携 (Bug AD 対策)
                enemyEffects: enemyEffects as any, // 敵状態異常を連携 (Bug AC)
                currentTurnNumber: freshBattle.turn, // ターン数を連携 (Bug S)
            };

            const actions = resolveNpcTurn(member, context);

            // v4.0: resolveNpcTurn内でmemberオブジェクトに書き込まれたlastUsedCardIdを保持
            const lastUsedCardId = (member as any).lastUsedCardId;

            for (const action of actions) {
                newMessages.push(action.message);

                if ((action.type === 'attack' || action.type === 'debuff') && action.damage) {
                    const isAoe = action.card?.target_type === 'all_enemies';
                    if (isAoe) {
                        trackedEnemies = trackedEnemies.map(e => {
                            if (e.hp > 0) {
                                const newHp = Math.max(0, e.hp - action.damage!);
                                if (e.id === currentTargetId) {
                                    enemyHp = newHp;
                                }
                                if (newHp <= 0 && e.id !== currentTargetId) {
                                    newMessages.push(`${e.name}を倒した！`);
                                }
                                return { ...e, hp: newHp };
                            }
                            return e;
                        });
                    } else {
                        enemyHp = Math.max(0, enemyHp - action.damage);
                        // Update tracked enemies array
                        trackedEnemies = trackedEnemies.map(e =>
                            e.id === currentTargetId ? { ...e, hp: enemyHp } : e
                        );
                    }
                }

                // Action heal processing
                let healAmount = action.healAmount || 0;
                if (!healAmount && action.card) {
                    const effInfo = getCardEffectInfo(action.card);
                    if (effInfo.effectType === 'heal') {
                        healAmount = (action.card as any).effect_val ?? action.card.power ?? 20;
                    }
                }

                if ((action.type === 'heal' || healAmount > 0) && healAmount > 0) {
                    if (action.targetName === 'あなた') {
                        const currentHp = get().userProfile?.hp || 0;
                        const maxHp = getEffectiveMaxHp(get().userProfile, get());
                        const newHp = Math.min(maxHp, currentHp + healAmount);
                        set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                        updateProfileStatusHelper({ hp: newHp }, get().userProfile?.id || null);
                        newMessages.push(`__hp_sync:${newHp}`);
                    } else {
                        const targetIdx = updatedParty.findIndex(m =>
                            m.name === action.targetName || (action.targetName === member.name && m.id === member.id)
                        );
                        if (targetIdx >= 0) {
                            const healTarget = updatedParty[targetIdx];
                            const newDur = Math.min(healTarget.max_durability || healTarget.durability || 100, (healTarget.durability || 0) + healAmount);
                            updatedParty[targetIdx] = { ...healTarget, durability: newDur };
                            if (targetIdx === i) {
                                member = { ...member, durability: newDur };
                            }
                            newMessages.push(`__party_sync:${healTarget.id}:${newDur}`);
                        } else {
                            const newDur = Math.min(member.max_durability || member.durability || 100, (member.durability || 0) + healAmount);
                            member = { ...member, durability: newDur };
                            updatedParty[i] = member;
                            newMessages.push(`__party_sync:${member.id}:${newDur}`);
                        }
                    }
                }

                if (action.effectId) {
                    const effectId = action.effectId as StatusEffectId;
                    const duration = action.effectDuration || 3;
                    const finalDuration = isTurnEndTickCompensated(effectId) ? duration + 1 : duration;
                    const isSelfBuff = isSelfBuffEffect(effectId);

                    const rawVal = action.card?.effect_val !== undefined ? Number(action.card.effect_val) : undefined;
                    const effectValue = rawVal !== undefined && !isNaN(rawVal) && rawVal !== 0
                        ? (['atk_up', 'atk_down', 'def_down', 'evasion_up'].includes(effectId)
                            ? rawVal / 100 
                            : rawVal)
                        : undefined;

                    if (isSelfBuff) {
                        const targetType = action.card?.target_type || '';
                        if (targetType === 'all_allies') {
                            // 味方全体バフ (Bug AD): プレイヤーと全員に適用
                            currentPlayerEffects = applyEffect(currentPlayerEffects, effectId, finalDuration, effectValue);
                            for (let j = 0; j < updatedParty.length; j++) {
                                if (updatedParty[j].is_active && (updatedParty[j].durability ?? 0) > 0) {
                                    updatedParty[j] = {
                                        ...updatedParty[j],
                                        status_effects: applyEffect((updatedParty[j].status_effects || []) as StatusEffect[], effectId, finalDuration, effectValue)
                                    };
                                }
                            }
                            member = { ...member, status_effects: updatedParty[i].status_effects };
                        } else if (action.targetName === 'あなた' || action.targetName === '味方') {
                            // プレイヤー単体バフ: プレイヤーのみに適用 (Bug AD)
                            currentPlayerEffects = applyEffect(currentPlayerEffects, effectId, finalDuration, effectValue);
                        } else {
                            // NPCバフ: 対象メンバーに適用。対象名が別NPCならそのNPCに適用、そうでなければ自身に適用
                            const targetIdx = updatedParty.findIndex(m => m.name === action.targetName);
                            if (targetIdx >= 0 && targetIdx !== i) {
                                updatedParty[targetIdx] = {
                                    ...updatedParty[targetIdx],
                                    status_effects: applyEffect((updatedParty[targetIdx].status_effects || []) as StatusEffect[], effectId, finalDuration, effectValue)
                                };
                            } else {
                                member = { ...member, status_effects: applyEffect((member.status_effects || []) as StatusEffect[], effectId, finalDuration, effectValue) };
                                updatedParty[i] = member;
                            }
                        }
                    } else {
                        // 強打(カードID: 1)の場合は共通処理でのスタン付与をスキップ（個別処理で10%判定されるため）
                        const isStrikeCard = (action.card?.id?.match(/^(\d+)/)?.[1] ?? action.card?.id) === '1';
                        if (!isStrikeCard) {
                            const isAoe = action.card?.target_type === 'all_enemies';
                            if (isAoe) {
                                const affectedEnemies: string[] = [];
                                const resistedEnemies: string[] = [];
                                trackedEnemies = trackedEnemies.map(e => {
                                    if (e.hp > 0) {
                                        if (rollDebuffSuccess(effectId)) {
                                            const newEffects = applyEffect((e.status_effects || []) as StatusEffect[], effectId, finalDuration, effectValue);
                                            affectedEnemies.push(e.name);
                                            return { ...e, status_effects: newEffects };
                                        } else {
                                            resistedEnemies.push(e.name);
                                            return e;
                                        }
                                    }
                                    return e;
                                });
                                affectedEnemies.forEach(name => {
                                    newMessages.push(`→ ${name}に「${getEffectName(effectId)}」を付与した！(${finalDuration}ターン)`);
                                });
                                resistedEnemies.forEach(name => {
                                    newMessages.push(`→ ${name}は「${getEffectName(effectId)}」に抵抗した！`);
                                });
                            } else {
                                // v2.9.3k: デバフ成功率判定
                                if (rollDebuffSuccess(effectId)) {
                                    trackedEnemies = trackedEnemies.map(e => {
                                        if (e.id === currentTargetId) {
                                            const newEffects = applyEffect((e.status_effects || []) as StatusEffect[], effectId, finalDuration, effectValue);
                                            return { ...e, status_effects: newEffects };
                                        }
                                        return e;
                                    });
                                    newMessages.push(`→ ${resolvedEnemyName}に「${getEffectName(effectId)}」を付与した！(${finalDuration}ターン)`);
                                } else {
                                    newMessages.push(`→ ${resolvedEnemyName}は「${getEffectName(effectId)}」に抵抗した！`);
                                }
                            }
                        }
                    }
                }

                // v2.8: If current target died, retarget mid-action
                if (enemyHp <= 0) {
                    const nextAlive = trackedEnemies.find(e => e.hp > 0);
                    if (!nextAlive) break; // all enemies dead
                    // Retarget to next alive enemy
                    newMessages.push(`${trackedEnemies.find(e => e.id === currentTargetId)?.name || '敵'}を倒した！`);
                    currentTargetId = nextAlive.id;
                    enemyHp = nextAlive.hp;
                    enemyDef = nextAlive.def || 0;
                    resolvedEnemyName = nextAlive.name || '敵';
                    newMessages.push(`ターゲットを ${nextAlive.name} に切り替えた。`);
                    break; // end this NPC's remaining actions, next NPC will use new target
                }
            }

            updatedParty[i] = { ...member, current_ap: member.current_ap, lastUsedCardId } as any;
        }

        let updatedEnemies = trackedEnemies;

        const allEnemiesDead = updatedEnemies.every(e => e.hp <= 0);
        let nextTarget = updatedEnemies.find(e => e.id === currentTargetId) || null;
        if (nextTarget && nextTarget.hp <= 0) {
            const firstAlive = updatedEnemies.find(e => e.hp > 0);
            nextTarget = firstAlive || nextTarget;
            if (firstAlive && !newMessages.some(m => m.includes(`ターゲットを ${firstAlive.name}`))) {
                newMessages.push(`ターゲットを ${firstAlive.name} に切り替えた。`);
            }
        }

        set(state => ({
            battleState: {
                ...state.battleState,
                enemy: nextTarget,
                enemies: updatedEnemies,
                party: updatedParty,
                player_effects: currentPlayerEffects,
                messages: newMessages
            }
        }));

        if (allEnemiesDead) {
            const { selectedScenario } = get();
            const finalMessages = [...newMessages, 'パーティの活躍により、宿敵を打ち倒した！ 勝利！'];
            const isQuestBattle = useQuestState.getState().isInQuest;
            try {
                getAuthHeaders().then(authHeaders => {
                    const headers: HeadersInit = {
                        'Content-Type': 'application/json',
                        ...authHeaders
                    };
                    // クエスト外バトル（パブバトル等）のみ世界への影響を報告
                    if (!isQuestBattle) {
                        fetch('/api/report-action', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ action: 'victory', impacts: selectedScenario?.impacts, scenario_id: selectedScenario?.id })
                        }).catch(console.error);
                    }
                    // [Security] v27.2: サーバーサイドバトル結果検証
                    const bsid = get().battleState.battle_session_id;
                    if (bsid) {
                        fetch('/api/battle/validate-result', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ battle_session_id: bsid, claimed_result: 'victory' })
                        }).then(vRes => vRes.json()).then(vData => {
                            if (vData.battle_completion_token) {
                                set(state => ({
                                    battleState: { ...state.battleState, battle_completion_token: vData.battle_completion_token }
                                }));
                            }
                        }).catch(err => console.error('Validation failed:', err));
                    }
                }).catch(console.error);

                // バトル後のHP/VITをDB保存（Service Role API使用でRLSバイパス）
                const battleHp = get().userProfile?.hp;
                const battleVit = get().userProfile?.vitality;
                const battleUserId = get().userProfile?.id;
                if (battleHp != null && battleUserId) {
                    const updateBody: any = { hp: Math.max(0, battleHp) };
                    if (battleVit != null) updateBody.vitality = battleVit;
                    updateProfileStatusHelper(updateBody, battleUserId);
                }
                get().fetchWorldState();
                // fetchUserProfile 後にバトル中のHP値を復元（DB遅延による上書き防止）
                const preservedHp = get().userProfile?.hp;
                const preservedVit = get().userProfile?.vitality;
                get().fetchUserProfile().then(() => {
                    if (preservedHp != null) {
                        set(state => ({
                            userProfile: state.userProfile
                                ? { ...state.userProfile, hp: preservedHp, vitality: preservedVit ?? state.userProfile.vitality }
                                : state.userProfile
                        }));
                    }
                }).catch(console.error);
                // クエスト外バトルのみ金貨報酬を付与（クエスト中バトルの報酬はクエスト完了APIで処理）
                if (!isQuestBattle) {
                    const partyCount = (initialBattle.party.length || 0) + 1;
                    const rewardGold = selectedScenario?.reward_gold || 50;
                    const reward = Math.floor(rewardGold / partyCount);
                    get().addGold(reward);
                    finalMessages.push(`報酬 金貨 ${rewardGold} 枚を獲得。`);
                    if (partyCount > 1) finalMessages.push(`(パーティ分配: 1人あたり ${reward} 枚)`);
                    updateProfileStatusHelper({ gold: get().gold }, get().userProfile?.id || null);
                    finalMessages.push('あなたの活躍が、世界の情勢に微かな変化をもたらしました。');
                }
            } catch (e) { console.error(e); }
            set(state => ({ battleState: { ...state.battleState, isVictory: true, messages: finalMessages } }));
            return;
        }

        set(state => ({ battleState: { ...state.battleState, battlePhase: 'npc_done' } }));
    },

    processEnemyTurn: async (shouldAdvanceTurn: boolean = true) => {
        const { battleState, userProfile } = get();

        // 既に勝利済みなら即リターン
        if (battleState.isVictory || battleState.battle_result === 'victory') return;

        const enemies = battleState.enemies ? battleState.enemies.filter(e => e.hp > 0) : [];
        // 全敵HP0なら即リターン（battleState.enemy が残っていても無視）
        if (enemies.length === 0) return;

        const activeEnemies = enemies;
        let updatedEnemies = [...(battleState.enemies || [])];
        let newMessages = [...battleState.messages];
        let newParty = [...battleState.party];
        let currentPlayerEffects = [...(battleState.player_effects || [])] as StatusEffect[];
        let newUserProfile = userProfile ? { ...userProfile } : null;
        let vitDamageTaken = battleState.vitDamageTakenThisTurn;

        for (const enemy of activeEnemies) {
            const currentEnemyStatus = updatedEnemies.find(e => e.id === enemy.id);
            if (!currentEnemyStatus || currentEnemyStatus.hp <= 0) continue;
            const enemyStatusEffects = (currentEnemyStatus.status_effects || []) as StatusEffect[];
            if (isStunned(enemyStatusEffects)) {
                newMessages.push(`${enemy.name}はスタン状態で行動できない！`);
                continue;
            }

            // v4.2: 敵行動時の出血ダメージ（カード使用時ダメージの仕様）
            const bleedDmg = getBleedDamage(enemyStatusEffects);
            if (bleedDmg > 0) {
                const eIdx = updatedEnemies.findIndex(e => e.id === enemy.id);
                if (eIdx !== -1) {
                    const newHp = Math.max(0, updatedEnemies[eIdx].hp - bleedDmg);
                    updatedEnemies[eIdx] = { ...updatedEnemies[eIdx], hp: newHp };
                    newMessages.push(`${enemy.name}の出血ダメージ！ HP -${bleedDmg}`);
                    if (newHp <= 0) {
                        newMessages.push(`${enemy.name}は出血で倒れた！`);
                        continue; // 出血で倒れた場合は行動キャンセル
                    }
                }
            }

            newMessages.push(`${enemy.name}の行動！`);

            const actions = (enemy as any).action_pattern || [];
            let selectedSkillSlug: string | null = null;
            let selectedSkillName: string = '攻撃'; // v2.7: スキル名保持
            let applyStun = false;
            let isDrainVit = false;

            if (actions.length > 0) {
                const validActions = actions.filter((a: any) => {
                    if (!a.condition) return true;
                    const parts = String(a.condition).split(':');
                    const condType = parts[0];
                    const condVal = Number(parts[1]) || 0;
                    switch (condType) {
                        case 'turn_mod': return battleState.turn > 0 && battleState.turn % condVal === 0;
                        case 'hp_under': return currentEnemyStatus.hp < enemy.maxHp * (condVal / 100); // 最新HPを参照 (Bug AG)
                        default: return true;
                    }
                });

                // v4.0: 連打防止 — 直前ターンに使用したスキルを除外
                const lastUsed = (enemy as any).lastUsedSkill as string | undefined;
                const cooldownFiltered = validActions.filter((a: any) => a.skill !== lastUsed);
                const finalActions = cooldownFiltered.length > 0 ? cooldownFiltered : validActions;

                if (finalActions.length > 0) {
                    const totalProb = finalActions.reduce((sum: number, a: any) => sum + (a.prob || 0), 0);
                    let roll = Math.floor(Math.random() * totalProb);
                    for (const action of finalActions) {
                        roll -= (action.prob || 0);
                        if (roll < 0) { selectedSkillSlug = action.skill; break; }
                    }
                    if (!selectedSkillSlug) selectedSkillSlug = finalActions[finalActions.length - 1].skill;
                }
            }

            const skillDef = selectedSkillSlug ? getEnemySkill(selectedSkillSlug) : null;
            let enemyAtk = 0;
            // v2.9.3h: 状態異常付与フラグ
            let applyPoison = false;
            let applyBlind = false;
            let applyBleed = false;
            let applyDefDown = false;

            if (skillDef) {
                selectedSkillName = skillDef.name;
                // v2.9.3g: CSVのatk値を使用。未設定時はlevelベースのフォールバック
                const baseAtk = (enemy as any).atk || ((enemy.level || 1) * 3 + 5);
                switch (skillDef.effect_type) {
                    case 'damage': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        if (selectedSkillSlug === 'skill_god_purge' || selectedSkillSlug === 'skill_boss_stun') applyStun = true;
                        break;
                    }
                    case 'heal': {
                        const healAmount = skillDef.value;
                        const newEnemyHp = Math.min(enemy.maxHp, currentEnemyStatus.hp + healAmount); // 最新HPを参照 (Bug AG)
                        const actualHeal = newEnemyHp - currentEnemyStatus.hp;
                        updatedEnemies = updatedEnemies.map(e => e.id === enemy.id ? { ...e, hp: newEnemyHp } : e);
                        newMessages.push(`${enemy.name}の『${skillDef.name}』！ 自身の HP ${actualHeal} 回復！`);
                        continue;
                    }
                    case 'drain_vit': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        isDrainVit = true;
                        break;
                    }
                    case 'status_effect': {
                        applyStun = true;
                        enemyAtk = Math.floor(baseAtk * 0.5);
                        break;
                    }
                    // ─── v2.9.3h: 状態異常付きダメージスキル ───
                    case 'damage_poison': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        applyPoison = true;
                        break;
                    }
                    case 'damage_blind': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        applyBlind = true;
                        break;
                    }
                    case 'damage_bleed': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        applyBleed = true;
                        break;
                    }
                    case 'damage_stun': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        applyStun = true;
                        break;
                    }
                    // ─── v2.9.3h: 自己バフ / デバフ付与 ───
                    case 'buff_self_atk': {
                        // 自身にATK UP(3T)を付与、ダメージなし
                        const eIdx = updatedEnemies.findIndex(e => e.id === enemy.id);
                        if (eIdx !== -1) {
                            let eEffects = [...(updatedEnemies[eIdx].status_effects || [])] as StatusEffect[];
                            eEffects = applyEffect(eEffects, 'atk_up', 3);
                            updatedEnemies[eIdx] = { ...updatedEnemies[eIdx], status_effects: eEffects };
                        }
                        newMessages.push(`${enemy.name}の『${skillDef.name}』！ 攻撃力が上がった！ (攻撃力上昇 3T)`);
                        continue;
                    }
                    case 'buff_self_def': {
                        // 自身にDEF UP(3T/5T)を付与し、HPを回復する (Bug AJ & Bug AG)
                        const healAmount = skillDef.value || 0;
                        const newEnemyHp = Math.min(enemy.maxHp, currentEnemyStatus.hp + healAmount);
                        const actualHeal = newEnemyHp - currentEnemyStatus.hp;

                        const eIdx = updatedEnemies.findIndex(e => e.id === enemy.id);
                        if (eIdx !== -1) {
                            let eEffects = [...(updatedEnemies[eIdx].status_effects || [])] as StatusEffect[];
                            const isAngelOrGolem = selectedSkillSlug === 'skill_angel_aegis' || selectedSkillSlug === 'skill_golem_armor';
                            const duration = isAngelOrGolem ? 3 : 5;
                            eEffects = applyEffect(eEffects, 'def_up', duration);
                            updatedEnemies[eIdx] = { ...updatedEnemies[eIdx], hp: newEnemyHp, status_effects: eEffects };
                            newMessages.push(`${enemy.name}の『${skillDef.name}』！ 自身の防御力が上がり、HPが${actualHeal}回復した！ (防御力上昇 ${duration}T)`);
                        }
                        continue;
                    }
                    case 'debuff_atk_down': {
                        // スキルに応じた適切なターン数と対象を取得する (Bug AJ)
                        const isPartyAoe = selectedSkillSlug === 'skill_gabriel_horn';
                        const is3Turn = ['skill_gabriel_horn', 'skill_baph_corrupt', 'skill_mino_bellow'].includes(selectedSkillSlug || '');
                        const duration = is3Turn ? 3 : 2;

                        if (isPartyAoe) {
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'atk_down', duration);
                            newParty = newParty.map(p => {
                                if (!p.is_active || (p.durability ?? 0) <= 0) return p;
                                const pEffects = applyEffect((p.status_effects || []) as StatusEffect[], 'atk_down', duration);
                                return { ...p, status_effects: pEffects };
                            });
                            newMessages.push(`${enemy.name}の『${skillDef.name}』！ 味方全員の攻撃力が下がった！ (攻撃力低下 ${duration}T)`);
                        } else {
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'atk_down', duration);
                            newMessages.push(`${enemy.name}の『${skillDef.name}』！ あなたの攻撃力が下がった！ (攻撃力低下 ${duration}T)`);
                        }
                        continue;
                    }
                    case 'debuff_def_down': {
                        // スキルに応じた適切なターン数と対象を取得する (Bug AJ)
                        const isPartyAoe = selectedSkillSlug === 'skill_zeus_storm';
                        const is3Turn = ['skill_zeus_storm', 'skill_death_sentence', 'skill_dragon_roar_e'].includes(selectedSkillSlug || '');
                        const duration = is3Turn ? 3 : 2;

                        if (isPartyAoe) {
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'def_down', duration);
                            newParty = newParty.map(p => {
                                if (!p.is_active || (p.durability ?? 0) <= 0) return p;
                                const pEffects = applyEffect((p.status_effects || []) as StatusEffect[], 'def_down', duration);
                                return { ...p, status_effects: pEffects };
                            });
                            newMessages.push(`${enemy.name}の『${skillDef.name}』！ 味方全員の防御力が下がった！ (防御力低下 ${duration}T)`);
                        } else {
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'def_down', duration);
                            newMessages.push(`${enemy.name}の『${skillDef.name}』！ あなたの防御力が下がった！ (防御力低下 ${duration}T)`);
                        }
                        continue;
                    }
                }
            } else {
                const atkDownMod = getAtkDownMod(enemyStatusEffects);
                // v2.9.3g: action_pattern未定義時もCSVのatk値を使用
                const fallbackAtk = (enemy as any).atk || ((enemy.level || 1) * 5 + 10);
                enemyAtk = Math.floor(fallbackAtk * atkDownMod);
            }

            // v4.0: ミス判定（基礎ミス率 + blind 加算方式）
            const blindMissRate = getMissChance(enemyStatusEffects);
            if (rollMiss(BATTLE_RULES.ENEMY_MISS_RATE, blindMissRate)) {
                const totalMiss = Math.min(95, Math.floor((BATTLE_RULES.ENEMY_MISS_RATE + blindMissRate) * 100));
                const skillLabel = skillDef ? `『${selectedSkillName}』` : '攻撃';
                newMessages.push(`${enemy.name}の${skillLabel}は外れた！ ミス！ (${totalMiss}%)`);
                // v4.0: lastUsedSkill更新
                updatedEnemies = updatedEnemies.map(e => e.id === enemy.id ? { ...e, lastUsedSkill: selectedSkillSlug } as any : e);
                continue;
            }

            if (enemyAtk <= 0) continue;

            // v4.0: ダメージ揺らぎ + クリティカル（DEF減算前）
            const enemyCritRate = (enemy.level || 1) >= 20 ? BATTLE_RULES.ENEMY_BOSS_CRIT_RATE : BATTLE_RULES.ENEMY_CRIT_RATE;
            const playerHasCritVul = currentPlayerEffects.some(e => e.id === 'crit_vulnerability' && e.duration > 0);
            const finalEnemyCritRate = playerHasCritVul ? enemyCritRate + 0.15 : enemyCritRate; // 被クリティカルUP反映 (Bug W)
            const variance = BATTLE_RULES.DAMAGE_VARIANCE_MIN + Math.random() * (BATTLE_RULES.DAMAGE_VARIANCE_MAX - BATTLE_RULES.DAMAGE_VARIANCE_MIN);
            let variedAtk = enemyAtk * variance;
            const isEnemyCrit = Math.random() < finalEnemyCritRate;
            if (isEnemyCrit) {
                variedAtk = variedAtk * BATTLE_RULES.CRIT_MULTIPLIER;
            }
            const finalEnemyAtk = Math.max(1, Math.floor(variedAtk));
            const enemyCritLabel = isEnemyCrit ? ' クリティカルヒット！' : '';

            // v4.0: lastUsedSkill更新
            updatedEnemies = updatedEnemies.map(e => e.id === enemy.id ? { ...e, lastUsedSkill: selectedSkillSlug } as any : e);

            const evasionChance = getEvasionChance(currentPlayerEffects);
            if (evasionChance > 0 && Math.random() < evasionChance) {
                newMessages.push(`${enemy.name}の攻撃を華麗に回避した！ (evasion_up)`);
                continue;
            }

            let result = routeDamage(newParty, finalEnemyAtk);

            // cover_all check: if player has cover_all, redirect any PartyMember attack to Player
            const hasCoverAll = currentPlayerEffects.some(e => e.id === 'cover_all' && e.duration > 0);
            if (hasCoverAll && result.target === 'PartyMember') {
                result = {
                    target: 'Player',
                    damage: result.damage,
                    isCovered: true,
                    message: `身代わりの盾！ あなたが攻撃を肩代わりした！`
                };
            }

            if (result.target === 'PartyMember' && result.targetId) {
                newParty = newParty.map(p => {
                    if (p.id === result.targetId) {
                        const baseDef = p.def || 0;
                        const pEffects = (p.status_effects || []) as StatusEffect[];
                        const defBonus = getDefBonus(pEffects);
                        const defDownMod = getDefDownMod(pEffects);
                        const effectiveDef = Math.floor((baseDef + defBonus) * defDownMod);
                        let mitigated = Math.max(1, result.damage - effectiveDef);
                        if (pEffects.some(e => e.id === 'unyielding_barrier' && e.duration > 0)) {
                            mitigated = Math.max(1, mitigated - 30);
                        }
                        const newDur = Math.max(0, p.durability - mitigated);
                        const skillLabel = skillDef ? `『${selectedSkillName}』` : '攻撃';
                        const defDesc = effectiveDef > 0 ? ` (防御減算 -${effectiveDef})` : '';
                        if (result.isCovered) {
                            newMessages.push(`${enemy.name}の${skillLabel}！${enemyCritLabel} ${p.name}がかばった！ ${mitigated} ダメージ${defDesc} (HP: ${p.durability} → ${newDur})`);
                        } else {
                            newMessages.push(`${enemy.name}の${skillLabel}！${enemyCritLabel} ${p.name}に ${mitigated} ダメージ${defDesc} (HP: ${p.durability} → ${newDur})`);
                        }
                        newMessages.push(`__party_sync:${p.id}:${newDur}`);
                        if (newDur <= 0) {
                            newMessages.push(`${p.name}は力尽きた...`);
                            if (p.origin_type !== 'quest_guest') {
                                supabase.from('party_members').update({ durability: 0, is_active: false }).eq('id', p.id).then();
                            }
                        }
                        return { ...p, durability: newDur, is_active: newDur > 0 };
                    }
                    return p;
                });
            }

            if (result.target === 'Player') {
                const def = getEffectiveDef(newUserProfile, get().battleState);
                const defBonus = getDefBonus(currentPlayerEffects);
                // v2.9.3h: DEF DOWNデバフ適用（DEF半減）
                const defDownMod = getDefDownMod(currentPlayerEffects);
                const effectiveDef = Math.floor((def + defBonus) * defDownMod);
                let mitigated = Math.max(1, result.damage - effectiveDef);
                if (currentPlayerEffects.some(e => e.id === 'unyielding_barrier' && e.duration > 0)) {
                    mitigated = Math.max(1, mitigated - 30);
                }

                if (newUserProfile) {
                    const prevHp = newUserProfile.hp || 0;
                    const newHp = Math.max(0, prevHp - mitigated);
                    const actualDamage = prevHp - newHp;
                    newUserProfile.hp = newHp;
                    const skillLabel = skillDef ? `『${selectedSkillName}』` : '攻撃';

                    if (mitigated > 0) {
                        const defDesc = effectiveDef > 0 ? ` (防御減算 -${effectiveDef})` : '';
                        if (result.isCovered) {
                            newMessages.push(`身代わりの盾！ あなたが攻撃を肩代わりした！`);
                        }
                        newMessages.push(`${enemy.name}の${skillLabel}！${enemyCritLabel} あなたに ${mitigated} ダメージ${defDesc} (HP: ${prevHp} → ${newHp})`);
                        newMessages.push(`__hp_sync:${newHp}`);

                        // Reflection check
                        let reflectDmg = 0;
                        let reflectMsgs: string[] = [];

                        if (currentPlayerEffects.some(e => e.id === 'counter_spike' && e.duration > 0)) {
                            const spikeDmg = Math.max(1, Math.floor(def / 2));
                            reflectDmg += spikeDmg;
                            reflectMsgs.push(`棘の鎧の効果で ${enemy.name} に ${spikeDmg} ダメージを反射！`);
                        }
                        if (currentPlayerEffects.some(e => e.id === 'revenge_shield' && e.duration > 0)) {
                            const revDmg = mitigated;
                            reflectDmg += revDmg;
                            reflectMsgs.push(`報復の盾の効果で ${enemy.name} に ${revDmg} ダメージを反射！`);
                        }

                        if (reflectDmg > 0) {
                            const eIdx = updatedEnemies.findIndex(e => e.id === enemy.id);
                            if (eIdx !== -1) {
                                const newEnemyHp = Math.max(0, updatedEnemies[eIdx].hp - reflectDmg);
                                updatedEnemies[eIdx] = { ...updatedEnemies[eIdx], hp: newEnemyHp };
                                newMessages.push(...reflectMsgs);
                                if (newEnemyHp <= 0) {
                                    newMessages.push(`${enemy.name}は反射ダメージで倒れた！`);
                                }
                            }
                        }
                    } else {
                        newMessages.push('あなたに攻撃！ しかしもう意識がない…');
                    }

                    if (isDrainVit && actualDamage > 0 && newHp > 0 && !vitDamageTaken) {
                        const currentVit = newUserProfile.vitality ?? 100;
                        if (currentVit > 0) {
                            newUserProfile.vitality = currentVit - 1;
                            vitDamageTaken = true;
                            newMessages.push('生命力を奪われた！ (Vitality -1)');
                            const { selectedProfileId } = get();
                            consumeVitalityHelper(1, get().userProfile?.id || selectedProfileId);
                        }
                    }

                    if (applyStun && actualDamage > 0) {
                        // 状態異常判定時に最新の効果（スタン免疫等）を参照するように修正 (Bug AA & AJ)
                        const hasStunImmunity = currentPlayerEffects.some(e => e.id === 'stun_immune' && e.duration > 0);
                        if (hasStunImmunity) {
                            newMessages.push('強靭な意志で気絶現象を弾き返した！');
                        } else if (!rollDebuffSuccess('stun')) {
                            newMessages.push('気絶攻撃に耐え抜いた！');
                        } else {
                            newMessages.push('凄まじい衝撃で気絶した！');
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'stun', 1);
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'stun_immune', 2);
                        }
                    }

                    // v2.9.3h: 状態異常付与（ダメージ命中時のみ） + v2.9.3k: 確率判定
                    if (applyPoison && actualDamage > 0) {
                        if (rollDebuffSuccess('poison')) {
                            newMessages.push('毒に侵された！ (毒 3T)');
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'poison', 3);
                        } else {
                            newMessages.push('毒を弾き返した！');
                        }
                    }
                    if (applyBlind && actualDamage > 0) {
                        if (rollDebuffSuccess('blind_minor')) {
                            newMessages.push('目が眩んだ！ (目潰し 2T)');
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'blind_minor', 2);
                        } else {
                            newMessages.push('目潰しを回避した！');
                        }
                    }
                    if (applyBleed && actualDamage > 0) {
                        if (rollDebuffSuccess('bleed')) {
                            newMessages.push('傷口から血が流れ出す！ (出血 2T)');
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'bleed', 2);
                        } else {
                            newMessages.push('出血を堪えた！');
                        }
                    }
                    if (applyDefDown && actualDamage > 0) {
                        if (rollDebuffSuccess('def_down')) {
                            newMessages.push('防御が崩された！ (防御力低下 2T)');
                            currentPlayerEffects = applyEffect(currentPlayerEffects, 'def_down', 2);
                        } else {
                            newMessages.push('防御崩しに耐えた！');
                        }
                    }

                    if (newHp <= 0) break;
                }
            }
        }

        if (newUserProfile && (newUserProfile.hp ?? 0) <= 0) {
            newMessages.push('あなたは力尽きた...');

            const hasBountyEnemy = activeEnemies.some(e => e.spawn_type === 'bounty');
            const isColosseum = newUserProfile?.current_quest_id && String(newUserProfile.current_quest_id).startsWith('colosseum_');

            if (hasBountyEnemy && newUserProfile) {
                if (!isColosseum) {
                    const currentGold = newUserProfile.gold || 0;
                    const penalty = Math.ceil(currentGold / 2);
                    if (penalty > 0) {
                        newMessages.push(`賞金稼ぎに身包みを剥がされた… 所持金の半分（${penalty}G）を失った！`);
                        setTimeout(() => {
                            get().spendGold(penalty);
                            updateProfileStatusHelper({ gold: Math.max(0, currentGold - penalty) }, get().userProfile?.id || null);
                        }, 100);
                    }
                } else {
                    newMessages.push(`賞金稼ぎに敗北したが、闘技場の防衛魔術のおかげでゴールドを奪われずに済んだ！`);
                }
            }

            soundManager?.playSE('se_battle_lose');
            set(state => ({
                userProfile: newUserProfile,
                battleState: { ...state.battleState, isDefeat: true, player_effects: currentPlayerEffects, messages: newMessages }
            }));
        } else {
            if (shouldAdvanceTurn) {
                const { battleState: latestBattle } = get();
                const nextTurn = latestBattle.turn + 1;
                const turnLabel = `--- ターン ${nextTurn} ---`;

                set(state => ({
                    userProfile: newUserProfile,
                    battleState: {
                        ...state.battleState,
                        turn: nextTurn,
                        enemy: state.battleState.enemy,
                        enemies: updatedEnemies.map(e => e.hp > 0 ? e : { ...e, hp: 0 }),
                        party: newParty,
                        player_effects: currentPlayerEffects,
                        messages: [...newMessages, turnLabel],
                        vitDamageTakenThisTurn: false,
                        isPlayerTurn: false,
                        battlePhase: 'enemy_done',
                    }
                }));
            } else {
                const buffStatusLogs = getBuffStatusLogMessages(currentPlayerEffects);
                set(state => ({
                    userProfile: newUserProfile,
                    battleState: {
                        ...state.battleState,
                        enemy: state.battleState.enemy,
                        enemies: updatedEnemies.map(e => e.hp > 0 ? e : { ...e, hp: 0 }),
                        party: newParty,
                        player_effects: currentPlayerEffects,
                        messages: [...newMessages, ...buffStatusLogs],
                        vitDamageTakenThisTurn: false,
                        isPlayerTurn: true,
                        battlePhase: 'player',
                        cardsPlayedThisTurn: 0,
                    }
                }));
                get().dealHand();
            }
        }
    },
});
