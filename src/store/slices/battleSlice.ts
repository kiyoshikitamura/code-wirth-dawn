import { supabase } from '@/lib/supabase';
import { Card, Enemy, PartyMember, InventoryItem } from '@/types/game';
import { buildBattleDeck, routeDamage, canAffordCard, calculateDamage } from '@/lib/battleEngine';
import { resolveNpcTurn, determineRole, determineGrade, BattleContext } from '@/lib/npcAI';
import { StatusEffect, applyEffect, tickEffects, getBleedDamage, isStunned, StatusEffectId, getEffectName, getMissChance, getAtkDownMod, getEvasionChance, getDefBonus } from '@/lib/statusEffects';
import { validateCardUse, getDefaultTarget } from '@/lib/targeting';
import { getCardEffectInfo } from '@/lib/cardEffects';
import { getPassiveLabel } from '@/lib/passiveEffects';
import { getEnemySkill } from '@/lib/enemySkills';
import { useQuestState } from '../useQuestState';
import { GROWTH_RULES } from '@/constants/game_rules';
import { soundManager } from '@/lib/soundManager';
import { getEffectiveAtk, getEffectiveDef, getEffectiveMaxHp } from './profileSlice';
import type { GameState } from '../types';

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
                messages: [],
                isVictory: false,
                isDefeat: false,
                player_effects: [],
                enemy_effects: [],
                exhaustPile: [],
                consumedItems: [],
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

        const guest = useQuestState.getState().guest;
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
                image_url: i.effect_data?.image_url || i.image_url || undefined,
                isEquipment: true,
            }));

        const neededCardIds = new Set<string>();
        partyMembers.forEach(p => { p.inject_cards?.forEach(id => neededCardIds.add(String(id))); });

        const BASIC_CARD_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
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
                cost: c.cost_val || c.cost || 0,
                power: c.effect_val || c.power || 0,
                ap_cost: c.ap_cost ?? 1,
                cost_type: c.cost_type || undefined,
                effect_id: c.effect_id || undefined,
                effect_duration: c.effect_duration || undefined,
                animation_type: c.animation_type || undefined,
                image_url: c.image_url || undefined,
            })) as Card[];
        }

        partyMembers = partyMembers.map(pm => {
            const sigDeck = (pm.inject_cards || []).map(id => {
                const found = partyCardPool.find(c => c.id === String(id));
                if (found) return found;
                return CARD_POOL.find(c => c.id === String(id));
            }).filter(Boolean) as Card[];

            const pmAny = pm as any;
            const fullHp = pm.max_durability || pmAny.max_hp || pmAny.hp || pm.durability || 100;

            return {
                ...pm,
                durability: fullHp,
                max_durability: fullHp,
                signature_deck: sigDeck,
                ai_role: determineRole({ ...pm, signature_deck: sigDeck }),
                ai_grade: determineGrade(pm),
                current_ap: 5,
                used_this_turn: [],
            };
        });

        const { deck: initialDeck, didProtectFromNoise } = buildBattleDeck(
            equippedCards,
            partyMembers,
            (id) => {
                const fromPool = partyCardPool.find(c => c.id === String(id));
                if (fromPool) return fromPool;
                return CARD_POOL.find(c => c.id === String(id));
            },
            worldState?.status,
            userProfile?.level || 1
        );

        const shuffledDeck = initialDeck.sort(() => 0.5 - Math.random());

        const { equipBonus } = get();
        console.log('[startBattle] equipBonus from store:', equipBonus);

        let initialAp = 5;
        let blessingActive = false;
        if (userProfile?.blessing_data) {
            const blessing = userProfile.blessing_data as any;
            blessingActive = true;
            initialAp += (blessing.ap_bonus || 0);
        }

        const hasEquipBonus = equipBonus.atk > 0 || equipBonus.def > 0 || equipBonus.hp > 0;
        const equipBonusMessages: string[] = [];
        if (hasEquipBonus) {
            const parts: string[] = [];
            if (equipBonus.atk > 0) parts.push(`ATK+${equipBonus.atk}`);
            if (equipBonus.def > 0) parts.push(`DEF+${equipBonus.def}`);
            if (equipBonus.hp > 0) parts.push(`HP+${equipBonus.hp}`);
            equipBonusMessages.push(`⚔️ 装備品ボーナス適用！ (${parts.join(' / ')})`);
        }

        const startMessages = [
            `${enemies.map(e => e.name).join('と')}が現れた！`,
            ...equipBonusMessages,
            ...(resonanceActive ? ['⚡ 共鳳ボーナス発動！ ATK/DEF +10%（同拠点プレイヤー在駐）'] : []),
            ...(blessingActive ? ['✨ 祈りの加護が発動！(開始APアップ & HP回復)'] : []),
            ...(didProtectFromNoise ? ['✨ 世界の意志の加護により、危険地帯の悪影響（ノイズ）から守られた。'] : []),
            `--- ターン 1 ---`
        ];

        const battleItems = (get().inventory || []).filter(i =>
            (i.item_type === 'consumable' || (i as any).type === 'consumable') &&
            ((i as any).effect_data?.use_timing === 'battle' || (i as any).use_timing === 'battle') &&
            (i.quantity || 0) > 0
        );

        set({
            battleState: {
                enemy: firstEnemy,
                enemies: enemies,
                party: partyMembers,
                turn: 1,
                current_ap: initialAp,
                messages: startMessages,
                isVictory: false,
                isDefeat: false,
                currentTactic: 'Aggressive',
                player_effects: [],
                enemy_effects: [],
                exhaustPile: [],
                consumedItems: [],
                vitDamageTakenThisTurn: false,
                battle_result: undefined,
                resonanceActive,
                equipBonus,
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

        soundManager?.playBgm('bgm_battle');

        fetch('/api/battle/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        if (!isStunned(battleState.player_effects as StatusEffect[])) {
            newAp = Math.min(10, newAp + 5);
        }

        let playerEffects = [...(battleState.player_effects || [])] as StatusEffect[];
        const playerMaxHp = getEffectiveMaxHp(userProfile, battleState);
        const playerTick = tickEffects(playerEffects, playerMaxHp, 'あなた');
        playerEffects = playerTick.newEffects;
        const tickMessages: string[] = [...playerTick.messages];

        if (playerTick.hpDelta !== 0 && userProfile) {
            const newHp = Math.max(0, Math.min(playerMaxHp, (userProfile.hp || 0) + playerTick.hpDelta));
            set(state => ({
                userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
            }));
            tickMessages.push(`__hp_sync:${newHp}`);
            const { selectedProfileId } = get();
            fetch('/api/profile/update-status', {
                method: 'POST',
                body: JSON.stringify({ hp: newHp, profileId: selectedProfileId })
            }).catch(console.error);
        }

        let updatedEnemies = [...battleState.enemies];
        let allEnemiesDead = true;

        updatedEnemies = updatedEnemies.map(enemy => {
            if (enemy.hp <= 0) return enemy;
            let eEffects = [...(enemy.status_effects || [])] as StatusEffect[];
            const eTick = tickEffects(eEffects, enemy.maxHp, enemy.name);
            tickMessages.push(...eTick.messages);
            const newHp = Math.max(0, enemy.hp + eTick.hpDelta);
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
        const maxHandSize = handSizeRule?.size ?? 3;

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

        const ed = (item as any).effect_data || {};
        const prevHp = userProfile?.hp ?? 0;
        let newHp = prevHp;
        const maxHp = userProfile?.max_hp ?? 100;
        let newPlayerEffects = [...(battleState.player_effects || [])] as any[];
        let newEnemyEffects = [...(battleState.enemy_effects || [])] as any[];
        let fleeNow = false;
        let effectApplied = false;

        const effectLabel: Record<string, string> = {
            regen: 'リジェネ', atk_up: '攻撃力アップ', def_up: '防御力アップ',
            stun_immune: 'スタン無効', evasion_up: '回避アップ', taunt: '挑発',
            poison: '毒', stun: 'スタン', bind: '拘束', bleed: '出血',
            fear: '恐怖', blind: '盲目', atk_down: '攻撃力ダウ',
        };
        const effectName = (id: string) => effectLabel[id] || id;
        const itemMessages: string[] = [];

        if (ed.escape) {
            effectApplied = true;
            fleeNow = true;
            itemMessages.push(`💨 ${item.name}を使った。煙幕に乗じて逃走した！`);
        }

        const healAmount = ed.heal || ed.heal_hp || ed.heal_amount || 0;
        const healPct = ed.heal_pct || ed.heal_percent || 0;
        const isHealItem = !!(ed.heal_full || ed.heal_all || healAmount > 0 || healPct > 0);
        const hasOtherEffect = !!(ed.escape || ed.remove_effect || ed.effect_id);

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

        if (ed.effect_id) {
            effectApplied = true;
            const duration = ed.effect_duration ?? 3;
            const isEnemy = ed.target === 'enemy';
            const isSelfBuff = ['regen', 'atk_up', 'def_up', 'stun_immune', 'evasion_up', 'taunt'].includes(ed.effect_id);

            if (isEnemy) {
                newEnemyEffects = [...newEnemyEffects, { id: ed.effect_id, duration }];
                itemMessages.push(`🔮 ${item.name}を投げつけた！ 敵に「${effectName(ed.effect_id)}」を付与した！(${duration}ターン)`);
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

        set(state => {
            const updates: any = {
                battleState: {
                    ...state.battleState,
                    messages: [...state.battleState.messages, ...itemMessages],
                    player_effects: newPlayerEffects,
                    enemy_effects: newEnemyEffects,
                    battleItems: newBattleItems,
                }
            };
            if (userProfile) {
                updates.userProfile = state.userProfile
                    ? { ...state.userProfile, hp: newHp }
                    : state.userProfile;
                updates.inventory = state.inventory.map((inv: any) =>
                    inv.id === item.id ? { ...inv, quantity: (inv.quantity || 1) - 1 } : inv
                );
            }
            return updates;
        });

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
            get().fleeBattle();
        }
    },

    attackEnemy: async (card?: Card, targetId?: string) => {
        const { battleState, selectedScenario, hand, userProfile } = get();

        const effectivePlayerAtk = getEffectiveAtk(userProfile, battleState);
        const effectivePlayerMaxHp = getEffectiveMaxHp(userProfile, battleState);

        const anyAlive = battleState.enemies?.some(e => e.hp > 0);
        if (!anyAlive || battleState.isVictory || battleState.isDefeat) return;

        let targetEnemyId = targetId || battleState.enemy?.id;
        let targetEnemy = battleState.enemies.find(e => e.id === targetEnemyId);

        if (!targetEnemy || targetEnemy.hp <= 0) {
            targetEnemy = battleState.enemies.find(e => e.hp > 0);
            targetEnemyId = targetEnemy?.id;
        }
        if (!targetEnemy) return;

        if (card) {
            const resolvedTargetId = targetId || getDefaultTarget(card, battleState);
            const validation = validateCardUse(card, resolvedTargetId, battleState);
            if (!validation.valid) {
                set(state => ({ battleState: { ...state.battleState, messages: [...state.battleState.messages, validation.error || '行動できません'] } }));
                return;
            }
            const apCost = card.ap_cost ?? 1;
            set(state => ({ battleState: { ...state.battleState, current_ap: (battleState.current_ap || 0) - apCost } }));

            if (card.cost_type === 'item') {
                const baseId = card.id.match(/^(\d+)/)?.[1] || card.id;
                if (battleState.consumedItems?.some(cid => cid.startsWith(baseId))) {
                    set(state => ({
                        battleState: {
                            ...state.battleState,
                            current_ap: (state.battleState.current_ap || 0) + apCost,
                            messages: [...state.battleState.messages, `${card.name}の素材が尽きた！（1戦闘1回制限）`]
                        }
                    }));
                    return;
                }
            }
        }

        if (card && battleState.battle_session_id) {
            fetch('/api/battle/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    battle_session_id: battleState.battle_session_id,
                    action_type: 'attack_enemy',
                    card,
                    target_id: targetEnemyId,
                    log_message: `Used ${card?.name}`
                })
            }).then(res => res.json()).then(data => {
                if (data.error) console.warn('Server validation failed:', data.error);
            });
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
            return;
        }

        if (card) {
            const bleedDmg = getBleedDamage(battleState.player_effects as StatusEffect[]);
            if (bleedDmg > 0 && userProfile) {
                const newHp = Math.max(0, (userProfile.hp || 0) - bleedDmg);
                set(state => ({
                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                    battleState: { ...state.battleState, messages: [...state.battleState.messages, `出血ダメージ！ HP -${bleedDmg}`] }
                }));
            }

            if (card.id === 'struggle' && userProfile) {
                const selfDmg = 1;
                const newHp = Math.max(0, (userProfile.hp || 0) - selfDmg);
                set(state => ({
                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                    battleState: { ...state.battleState, messages: [...state.battleState.messages, `あがきの反動！ HP -${selfDmg}`] }
                }));
            }

            effectInfo = getCardEffectInfo(card);
            soundManager?.playSEForCardEffect(effectInfo.effectType);

            switch (effectInfo.effectType) {
                case 'heal': {
                    const healAmount = (card as any).effect_val ?? card.power ?? 20;
                    if (userProfile && healAmount > 0) {
                        const maxHp = effectivePlayerMaxHp;
                        const newHp = Math.min(maxHp, (userProfile.hp || 0) + healAmount);
                        set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                        logMsg = `♥ ${card.name}で HP +${healAmount} 回復！ (${newHp}/${maxHp})`;
                        healSyncHp = newHp;
                        const { selectedProfileId } = get();
                        fetch('/api/profile/update-status', {
                            method: 'POST',
                            body: JSON.stringify({ hp: newHp, profileId: selectedProfileId })
                        }).catch(console.error);
                    } else { logMsg = `${card.name}を使用！(体力は満たんでいる)`; }
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
                        battleState: { ...state.battleState, isDefeat: true, battle_result: 'escape', messages: [...state.battleState.messages, logMsg] }
                    }));
                    return;
                }
                case 'buff_self': {
                    if (effectInfo.effectId) {
                        const defValue = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                            ? (effectInfo.defValue ?? card.power ?? 10) : undefined;
                        const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3, defValue);
                        set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        logMsg = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                            ? `${card.name}を使用！ DEF +${defValue} (${effectInfo.effectDuration || 3}T)！`
                            : `${card.name}を使用！ ${getEffectName(effectInfo.effectId)}を得た！`;
                    } else { logMsg = `${card.name}を使用！`; }
                    break;
                }
                case 'taunt': {
                    if (effectInfo.effectId) {
                        const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 2);
                        set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                    }
                    const sourceName = (card as any).source?.replace('Party:', '') || 'パーティメンバー';
                    logMsg = `${sourceName}が${card.name}！ 敵の攻撃を引きつけた！`;
                    break;
                }
                case 'buff_party': {
                    if (effectInfo.effectId) {
                        const defValue = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                            ? (effectInfo.defValue ?? 0) : undefined;
                        const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3, defValue);
                        set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        logMsg = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                            ? `${card.name}を展開！ パーティ全体のDEF +${effectInfo.defValue ?? 0} (${effectInfo.effectDuration || 3}T)！`
                            : `${card.name}を展開！ パーティ全体が守られた！`;
                    }
                    break;
                }
                case 'aoe_attack': {
                    damage = card.power ?? 0;
                    if (damage > 0) {
                        const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic');
                        damage = calculateDamage(damage, 0, battleState.player_effects as StatusEffect[], [], isMagic, effectivePlayerAtk);
                    }
                    logMsg = `${card.name}で全体攻撃！ 各敵に ${damage} のダメージ！`;
                    isAoe = true;
                    break;
                }
                case 'debuff_enemy': {
                    damage = card.power ?? 0;
                    if (damage > 0) {
                        damage = calculateDamage(damage, targetEnemy.def || 0, battleState.player_effects as StatusEffect[], targetEnemy.status_effects as StatusEffect[] || [], true, effectivePlayerAtk);
                        logMsg = `${targetEnemy.name}に${card.name}！ ${damage} ダメージ！`;
                    } else {
                        const eName = effectInfo.effectId ? getEffectName(effectInfo.effectId) : card.name;
                        logMsg = `${targetEnemy.name}に${card.name}を使用！ ${eName}を付与！`;
                    }
                    break;
                }
                case 'support_activate': {
                    const passiveLabel = getPassiveLabel(card.id);
                    const currentBuffs = get().battleState.activeSupportBuffs || [];
                    if (!currentBuffs.includes(card.id)) {
                        set(state => ({
                            battleState: {
                                ...state.battleState,
                                activeSupportBuffs: [...(state.battleState.activeSupportBuffs || []), card.id],
                            }
                        }));
                    }
                    if (effectInfo.effectId) {
                        const newEffects = applyEffect(get().battleState.player_effects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3);
                        set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        logMsg = `✨ ${card.name}を発動！ ${getEffectName(effectInfo.effectId)}(${effectInfo.effectDuration || 3}T) ${passiveLabel}`;
                    } else {
                        logMsg = `✨ ${card.name}を発動！ ${passiveLabel}（バトル終了まで）`;
                    }
                    break;
                }
                default: {
                    damage = card.power ?? 0;
                    if (damage > 0) {
                        const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic') || card.name.toLowerCase().includes('fire');
                        damage = calculateDamage(damage, targetEnemy.def || 0, battleState.player_effects as StatusEffect[], targetEnemy.status_effects as StatusEffect[] || [], isMagic, effectivePlayerAtk);
                        logMsg = `${targetEnemy.name}に${card.name}を使用！ ${damage} のダメージ！`;
                    } else { logMsg = `${card.name}を使用！`; }
                }
            }

            // Card Cycle
            nextHand = nextHand.filter(c => c.id !== card.id);
            if ((card.type === 'Item' && (card as any).isEquipment) || card.cost_type === 'item' || card.type === 'Support') {
                set(state => ({
                    battleState: {
                        ...state.battleState,
                        exhaustPile: [...state.battleState.exhaustPile, { id: card.id, name: card.name, type: card.type }],
                        consumedItems: [...state.battleState.consumedItems, card.id],
                    }
                }));
            } else {
                nextDiscardPile = [...nextDiscardPile, card];
            }

            // Self-buff via effectInfo
            if (!effectInfo.skipDamage && effectInfo.effectId) {
                const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(effectInfo.effectId);
                if (isSelfBuff) {
                    const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3);
                    set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                }
            }
            // Fallback: card.effect_id
            if (card.effect_id && !effectInfo.effectId) {
                const effectId = card.effect_id as StatusEffectId;
                const duration = card.effect_duration || 3;
                const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(effectId);
                if (isSelfBuff) {
                    const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectId, duration);
                    set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                }
            }
        }

        // Apply Damage & Effects to Enemies
        let newEnemies = battleState.enemies.map(e => {
            if (isAoe && e.hp > 0) {
                let newHp = Math.max(0, e.hp - damage);
                let newEffects = (e.status_effects || []) as StatusEffect[];
                if (effectInfo?.effectId) {
                    const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(effectInfo.effectId);
                    if (!isSelfBuff) {
                        const isStunAoe = effectInfo.effectId === 'stun' || effectInfo.effectId === 'bind';
                        const aoeDuration = isStunAoe ? (effectInfo?.effectDuration || 3) + 1 : (effectInfo?.effectDuration || 3);
                        newEffects = applyEffect(newEffects, effectInfo.effectId, aoeDuration);
                    }
                }
                return { ...e, hp: newHp, status_effects: newEffects };
            }
            if (e.id === targetEnemyId) {
                let newHp = Math.max(0, e.hp - damage);
                let newEffects = (e.status_effects || []) as StatusEffect[];
                const resolvedEffectId = effectInfo?.effectId || (card?.effect_id as StatusEffectId | undefined);
                if (resolvedEffectId) {
                    const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(resolvedEffectId);
                    if (!isSelfBuff) {
                        const isStunEffect = resolvedEffectId === 'stun' || resolvedEffectId === 'bind';
                        const baseDuration = effectInfo?.effectDuration || card?.effect_duration || 3;
                        const finalDuration = isStunEffect ? baseDuration + 1 : baseDuration;
                        newEffects = applyEffect(newEffects, resolvedEffectId, finalDuration);
                    }
                }
                return { ...e, hp: newHp, status_effects: newEffects };
            }
            return e;
        });

        const updatedTargetEnemy = newEnemies.find(e => e.id === targetEnemyId);
        const isTargetDead = updatedTargetEnemy ? updatedTargetEnemy.hp <= 0 : false;
        const allDead = newEnemies.every(e => e.hp <= 0);

        const newMessages = [...battleState.messages, logMsg];
        if (healSyncHp !== null) newMessages.push(`__hp_sync:${healSyncHp}`);
        if (damage > 0) {
            const resolvedEffectIdForLog = effectInfo?.effectId || (card?.effect_id as string | undefined);
            if (resolvedEffectIdForLog && !['atk_up', 'def_up', 'def_up_heavy', 'regen', 'stun_immune', 'evasion_up'].includes(resolvedEffectIdForLog)) {
                newMessages.push(`→ ${targetEnemy?.name}に「${getEffectName(resolvedEffectIdForLog as any)}」を付与した！`);
            }
        }
        if (isTargetDead) {
            newMessages.push(`${targetEnemy.name}を倒した！`);
            if (updatedTargetEnemy?.drop_rate && updatedTargetEnemy.drop_item_slug && Math.random() * 100 < updatedTargetEnemy.drop_rate) {
                newMessages.push(`${updatedTargetEnemy.name}が「${updatedTargetEnemy.drop_item_slug}」を落とした！`);
                const dropSlug = updatedTargetEnemy.drop_item_slug;
                const { userProfile: up } = get();
                const headers: HeadersInit = { 'Content-Type': 'application/json' };
                if (up?.id) headers['x-user-id'] = up.id;
                fetch('/api/inventory', { method: 'POST', headers, body: JSON.stringify({ item_slug: dropSlug, quantity: 1 }) })
                    .catch(err => console.error('Drop add failed', err));
            }
        }

        if (allDead) {
            newMessages.push('全ての敵を倒した！ 勝利！');
            try {
                fetch('/api/report-action', { method: 'POST', body: JSON.stringify({ action: 'victory', impacts: selectedScenario?.impacts, scenario_id: selectedScenario?.id }) });
                get().fetchWorldState();
                get().fetchUserProfile();
                const partyCount = (get().battleState.party?.length || 0) + 1;
                const gold = selectedScenario?.reward_gold || 50;
                get().addGold(Math.floor(gold / partyCount));
                const consumed = get().battleState.consumedItems || [];
                consumed.forEach(cid => fetch('/api/battle/use-item', { method: 'POST', body: JSON.stringify({ inventory_id: cid }) }));
            } catch (e) { console.error(e); }
        }

        set(state => ({
            hand: nextHand,
            discardPile: nextDiscardPile,
            battleState: {
                ...state.battleState,
                enemies: newEnemies,
                enemy: isTargetDead ? (newEnemies.find(e => e.hp > 0) || null) : updatedTargetEnemy || null,
                messages: newMessages,
                isVictory: allDead
            }
        }));
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
                            description: c!.description || '', cost: c!.cost_val ?? c!.cost ?? 0,
                            power: c!.effect_val ?? c!.power ?? 0, ap_cost: c!.ap_cost ?? 1,
                            effect_id: c!.effect_id ?? undefined, effect_duration: c!.effect_duration ?? undefined,
                            image_url: c!.image_url ?? undefined,
                        })) as Card[];
                    console.log(`[processPartyTurn] ${pm.name} deck restored: ${resolved.length} cards`);
                    return { ...pm, signature_deck: resolved, ai_role: determineRole({ ...pm, signature_deck: resolved }), ai_grade: determineGrade(pm), current_ap: pm.current_ap ?? 5, used_this_turn: [] };
                });
            }
        }

        const freshBattle = get().battleState;
        if (freshBattle.isVictory || freshBattle.isDefeat || !freshBattle.enemy) return;

        let newMessages = [...freshBattle.messages];
        let enemyHp = freshBattle.enemy.hp;
        const enemyDef = freshBattle.enemy.def || 0;
        const updatedParty = [...party];

        for (let i = 0; i < updatedParty.length; i++) {
            let member = { ...updatedParty[i] };
            if (!member.is_active || (member.durability ?? 100) <= 0) continue;

            member.used_this_turn = [];

            const context: BattleContext = {
                playerHp: get().userProfile?.hp || 0,
                playerMaxHp: get().userProfile?.max_hp || 100,
                enemyHp,
                enemyDef,
                partyMembers: updatedParty,
                playerEffects: freshBattle.player_effects,
            };

            const actions = resolveNpcTurn(member, context);

            for (const action of actions) {
                newMessages.push(action.message);

                if (action.type === 'attack' && action.damage) {
                    enemyHp = Math.max(0, enemyHp - action.damage);
                }

                if (action.type === 'heal' && action.healAmount) {
                    if (action.targetName === 'あなた') {
                        const currentHp = get().userProfile?.hp || 0;
                        const maxHp = get().userProfile?.max_hp || 100;
                        const newHp = Math.min(maxHp, currentHp + action.healAmount);
                        set(state => ({ userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null }));
                        fetch('/api/profile/update-status', { method: 'POST', body: JSON.stringify({ hp: newHp }) }).catch(console.error);
                        newMessages.push(`__hp_sync:${newHp}`);
                    } else {
                        const targetIdx = updatedParty.findIndex(m =>
                            m.name === action.targetName || (action.targetName === member.name && m.id === member.id)
                        );
                        const healTarget = targetIdx >= 0 ? updatedParty[targetIdx] : member;
                        const newDur = Math.min(healTarget.max_durability || healTarget.durability || 100, (healTarget.durability || 0) + action.healAmount);
                        if (targetIdx >= 0) updatedParty[targetIdx] = { ...healTarget, durability: newDur };
                        else { member = { ...member, durability: newDur }; updatedParty[i] = member; }
                        newMessages.push(`__party_sync:${healTarget.id}:${newDur}`);
                    }
                }

                if (action.effectId) {
                    const effectId = action.effectId as StatusEffectId;
                    const duration = action.effectDuration || 3;
                    const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune', 'evasion_up', 'taunt'].includes(effectId);
                    if (isSelfBuff) {
                        const currentEffects = get().battleState.player_effects as StatusEffect[];
                        const newEffects = applyEffect(currentEffects, effectId, duration);
                        set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        member = { ...member, status_effects: [...((member.status_effects || []) as StatusEffect[]).filter(e => e.id !== effectId), { id: effectId, duration }] };
                        updatedParty[i] = member;
                    } else {
                        const currentEffects = get().battleState.enemy_effects as StatusEffect[];
                        const newEffects = applyEffect(currentEffects, effectId, duration);
                        set(state => ({ battleState: { ...state.battleState, enemy_effects: newEffects } }));
                    }
                }

                if (enemyHp <= 0) break;
            }

            updatedParty[i] = { ...member, current_ap: member.current_ap };
            if (enemyHp <= 0) break;
        }

        let updatedEnemies = [...(get().battleState.enemies || [])].map(e =>
            e.id === freshBattle.enemy?.id ? { ...e, hp: enemyHp } : e
        );

        const allEnemiesDead = updatedEnemies.every(e => e.hp <= 0);
        let nextTarget = freshBattle.enemy ? { ...freshBattle.enemy, hp: enemyHp } : null;
        if (enemyHp <= 0 && !allEnemiesDead) {
            const firstAlive = updatedEnemies.find(e => e.hp > 0);
            if (firstAlive) { nextTarget = firstAlive; newMessages.push(`ターゲットを ${firstAlive.name} に切り替えた。`); }
        }

        set(state => ({
            battleState: { ...state.battleState, enemy: nextTarget, enemies: updatedEnemies, party: updatedParty, messages: newMessages }
        }));

        if (allEnemiesDead) {
            const { selectedScenario } = get();
            const finalMessages = [...newMessages, 'パーティの活躍により、宿敵を打ち倒した！ 勝利！'];
            try {
                await fetch('/api/report-action', { method: 'POST', body: JSON.stringify({ action: 'victory', impacts: selectedScenario?.impacts, scenario_id: selectedScenario?.id }) });
                await get().fetchWorldState();
                await get().fetchUserProfile();
                const partyCount = (initialBattle.party.length || 0) + 1;
                const rewardGold = selectedScenario?.reward_gold || 50;
                const reward = Math.floor(rewardGold / partyCount);
                get().addGold(reward);
                finalMessages.push(`報酬 金貨 ${rewardGold} 枚を獲得。`);
                if (partyCount > 1) finalMessages.push(`(パーティ分配: 1人あたり ${reward} 枚)`);
                fetch('/api/profile/update-status', { method: 'POST', body: JSON.stringify({ gold: get().gold }) }).catch(console.error);
                finalMessages.push('あなたの活躍が、世界の情勢に微かな変化をもたらしました。');
            } catch (e) { console.error(e); }
            set(state => ({ battleState: { ...state.battleState, isVictory: true, messages: finalMessages } }));
            return;
        }

        set(state => ({ battleState: { ...state.battleState, battlePhase: 'npc_done' } }));
    },

    processEnemyTurn: async (shouldAdvanceTurn: boolean = true) => {
        const { battleState, userProfile } = get();
        const enemies = battleState.enemies ? battleState.enemies.filter(e => e.hp > 0) : [];
        if (enemies.length === 0 && !battleState.enemy) return;

        const activeEnemies = enemies.length > 0 ? enemies : (battleState.enemy ? [battleState.enemy] : []);
        let updatedEnemies = [...(battleState.enemies || [])];
        let newMessages = [...battleState.messages];
        let newParty = [...battleState.party];
        let newUserProfile = userProfile ? { ...userProfile } : null;
        let vitDamageTaken = battleState.vitDamageTakenThisTurn;

        for (const enemy of activeEnemies) {
            const enemyStatusEffects = (enemy.status_effects || []) as StatusEffect[];
            if (isStunned(enemyStatusEffects)) {
                newMessages.push(`${enemy.name}はスタン状態で行動できない！`);
                continue;
            }

            newMessages.push(`${enemy.name}の行動！`);

            const actions = (enemy as any).action_pattern || [];
            let selectedSkillSlug: string | null = null;
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
                        case 'hp_under': return enemy.hp < enemy.maxHp * (condVal / 100);
                        default: return true;
                    }
                });

                if (validActions.length > 0) {
                    const totalProb = validActions.reduce((sum: number, a: any) => sum + (a.prob || 0), 0);
                    let roll = Math.floor(Math.random() * totalProb);
                    for (const action of validActions) {
                        roll -= (action.prob || 0);
                        if (roll < 0) { selectedSkillSlug = action.skill; break; }
                    }
                    if (!selectedSkillSlug) selectedSkillSlug = validActions[validActions.length - 1].skill;
                }
            }

            const skillDef = selectedSkillSlug ? getEnemySkill(selectedSkillSlug) : null;
            let enemyAtk = 0;

            if (skillDef) {
                const baseAtk = (enemy.level || 1) * 3 + 5;
                switch (skillDef.effect_type) {
                    case 'damage': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                        if (selectedSkillSlug === 'skill_god_purge' || selectedSkillSlug === 'skill_boss_stun') applyStun = true;
                        break;
                    }
                    case 'heal': {
                        const healAmount = skillDef.value;
                        const newEnemyHp = Math.min(enemy.maxHp, enemy.hp + healAmount);
                        const actualHeal = newEnemyHp - enemy.hp;
                        updatedEnemies = updatedEnemies.map(e => e.id === enemy.id ? { ...e, hp: newEnemyHp } : e);
                        newMessages.push(`${enemy.name}の『${skillDef.name}』！ HP ${actualHeal} 回復！`);
                        continue;
                    }
                    case 'drain_vit': {
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                        isDrainVit = true;
                        newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                        break;
                    }
                    case 'status_effect': {
                        applyStun = true;
                        enemyAtk = Math.floor(baseAtk * 0.5);
                        newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                        break;
                    }
                }
            } else {
                const atkDownMod = getAtkDownMod(enemyStatusEffects);
                enemyAtk = Math.floor(((enemy.level || 1) * 5 + 10) * atkDownMod);
                newMessages.push(`${enemy.name}の攻撃！`);
            }

            const missChance = getMissChance(enemyStatusEffects);
            if (missChance > 0 && Math.random() < missChance) {
                newMessages.push(`${enemy.name}の攻撃は目が見えず外れた！ (${Math.floor(missChance * 100)}%ミス)`);
                continue;
            }

            if (enemyAtk <= 0) continue;

            const playerEffectsNow = get().battleState.player_effects as StatusEffect[];
            const evasionChance = getEvasionChance(playerEffectsNow);
            if (evasionChance > 0 && Math.random() < evasionChance) {
                newMessages.push(`${enemy.name}の攻撃を華麗に回避した！ (evasion_up)`);
                continue;
            }

            const result = routeDamage(newParty, enemyAtk);

            if (result.target === 'PartyMember' && result.targetId) {
                newParty = newParty.map(p => {
                    if (p.id === result.targetId) {
                        const def = p.def || 0;
                        const mitigated = Math.max(1, result.damage - def);
                        const newDur = Math.max(0, p.durability - mitigated);
                        if (result.isCovered) newMessages.push(`${p.name}がかばった！ ${mitigated}のダメージ`);
                        else newMessages.push(`${p.name}に${mitigated}のダメージ`);
                        newMessages.push(`__party_sync:${p.id}:${newDur}`);
                        if (newDur <= 0) {
                            newMessages.push(`${p.name}は力尽きた...`);
                            supabase.from('party_members').update({ durability: 0, is_active: false }).eq('id', p.id).then();
                        }
                        return { ...p, durability: newDur, is_active: newDur > 0 };
                    }
                    return p;
                });
            }

            if (result.target === 'Player') {
                const def = getEffectiveDef(newUserProfile, get().battleState);
                const currentPlayerEffects = get().battleState.player_effects as StatusEffect[];
                const defBonus = getDefBonus(currentPlayerEffects);
                const mitigated = Math.max(1, result.damage - def - defBonus);

                if (newUserProfile) {
                    const prevHp = newUserProfile.hp || 0;
                    const newHp = Math.max(0, prevHp - mitigated);
                    const actualDamage = prevHp - newHp;
                    newUserProfile.hp = newHp;

                    if (mitigated > 0) {
                        const defDesc = (def > 0 || defBonus > 0) ? ` (DEF -${def}${defBonus > 0 ? ` 防御強化 -${defBonus}` : ''})` : '';
                        newMessages.push(`あなたに ${mitigated} のダメージ${defDesc}`);
                        newMessages.push(`__hp_sync:${newHp}`);
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
                            fetch('/api/profile/consume-vitality', {
                                method: 'POST',
                                body: JSON.stringify({ amount: 1, profileId: selectedProfileId })
                            }).catch(console.error);
                        }
                    }

                    if (applyStun && actualDamage > 0) {
                        const playerEffects = battleState.player_effects as StatusEffect[] || [];
                        const hasStunImmunity = playerEffects.some(e => e.id === 'stun_immune' && e.duration > 0);
                        if (hasStunImmunity) {
                            newMessages.push('強靭な意志で気絶現象を弾き返した！');
                        } else {
                            newMessages.push('凄まじい衝撃で気絶した！');
                            set(state => {
                                let currentEffects = [...(state.battleState.player_effects as StatusEffect[] || [])];
                                currentEffects = applyEffect(currentEffects, 'stun', 1);
                                currentEffects = applyEffect(currentEffects, 'stun_immune', 2);
                                return { battleState: { ...state.battleState, player_effects: currentEffects } };
                            });
                        }
                    }

                    if (newHp <= 0) break;
                }
            }
        }

        if (newUserProfile && (newUserProfile.hp ?? 0) <= 0) {
            newMessages.push('あなたは力尽きた...');

            const hasBountyEnemy = activeEnemies.some(e => e.spawn_type === 'bounty');
            if (hasBountyEnemy && newUserProfile) {
                const currentGold = newUserProfile.gold || 0;
                const penalty = Math.ceil(currentGold / 2);
                if (penalty > 0) {
                    newMessages.push(`賞金稼ぎに身包みを剥がされた… 所持金の半分（${penalty}G）を失った！`);
                    setTimeout(() => {
                        get().spendGold(penalty);
                        fetch('/api/profile/update-status', {
                            method: 'POST',
                            body: JSON.stringify({ gold: Math.max(0, currentGold - penalty) })
                        }).catch(console.error);
                    }, 100);
                }
            }

            soundManager?.playSE('se_battle_lose');
            set(state => ({
                userProfile: newUserProfile,
                battleState: { ...state.battleState, isDefeat: true, messages: newMessages }
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
                        messages: [...newMessages, turnLabel],
                        vitDamageTakenThisTurn: false,
                        isPlayerTurn: false,
                        battlePhase: 'enemy_done',
                    }
                }));
            } else {
                set(state => ({
                    userProfile: newUserProfile,
                    battleState: {
                        ...state.battleState,
                        enemy: state.battleState.enemy,
                        enemies: updatedEnemies.map(e => e.hp > 0 ? e : { ...e, hp: 0 }),
                        party: newParty,
                        messages: newMessages,
                        vitDamageTakenThisTurn: false,
                        isPlayerTurn: true,
                        battlePhase: 'player',
                    }
                }));
                get().dealHand();
            }
        }
    },
});
