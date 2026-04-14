import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Adventurer, Card, Enemy, WorldState, Scenario, InventoryItem, UserProfile, BattleState, PartyMember, UserHubState } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { WORLD_ID } from '@/utils/constants';
import { buildBattleDeck, routeDamage, canAffordCard, calculateDamage } from '@/lib/battleEngine';
import { resolveNpcTurn, determineRole, determineGrade, NpcAction, BattleContext } from '@/lib/npcAI';
import { StatusEffect, applyEffect, removeEffect, tickEffects, getBleedDamage, isStunned, hasEffect, StatusEffectId, getEffectName, getMissChance, getAtkDownMod, getEvasionChance, getDefBonus } from '@/lib/statusEffects';
import { validateCardUse, getDefaultTarget } from '@/lib/targeting';
import { getCardEffectInfo } from '@/lib/cardEffects';
import { getPassiveLabel, aggregateBattlePassives } from '@/lib/passiveEffects';
import { getEnemySkill } from '@/lib/enemySkills';
import { useQuestState } from './useQuestState';
import { GROWTH_RULES } from '@/constants/game_rules';
import { soundManager, CARD_EFFECT_SE_MAP } from '@/lib/soundManager';

// ─── v24 FINAL: 実効ステータス計算ヘルパー ───────────────────────────────────
function getEffectiveAtk(up: { atk?: number } | null, bs: { equipBonus?: { atk: number; def: number; hp: number }; resonanceActive?: boolean }): number {
    return Math.floor(((up?.atk || 0) + (bs.equipBonus?.atk || 0)) * (bs.resonanceActive ? 1.1 : 1.0));
}
function getEffectiveDef(up: { def?: number } | null, bs: { equipBonus?: { atk: number; def: number; hp: number }; resonanceActive?: boolean }): number {
    return Math.floor(((up?.def || 0) + (bs.equipBonus?.def || 0)) * (bs.resonanceActive ? 1.1 : 1.0));
}
function getEffectiveMaxHp(up: { max_hp?: number } | null, bs: { equipBonus?: { atk: number; def: number; hp: number } }): number {
    return (up?.max_hp || 100) + (bs.equipBonus?.hp || 0);
}
// ──────────────────────────────────────────────────────────────────────────────

const DUMMY_ENEMY: Enemy = {
    id: 'e1', name: 'Training Dummy', level: 1, hp: 50, maxHp: 50,
};

// v3.3: ノイズカードのフォールバック定義（実カードプールかDBフェッチで取得されなかった場合のフォールバックのみ残す）
const CARD_POOL: Card[] = [
    // 実カードプールは DBフェッチ（startBattle 内の partyCardPool）で上書きされるため、
    // ここには buildBattleDeck のノイズフォールバックのみ残す
    { id: 'card_noise', name: 'Noise', type: 'Basic', description: '心に増す雑音。使用不可。', cost: 1, power: 0 },
];

interface GameState {
    // Profile
    userProfile: UserProfile | null;
    selectedProfileId: string | null; // v3.7: Explicit Tracking
    setSelectedProfileId: (id: string | null) => void;
    fetchUserProfile: () => Promise<void>;

    battleState: BattleState;

    // Global
    worldState: WorldState | null;
    fetchWorldState: () => Promise<void>;
    hubState: UserHubState | null;
    fetchHubState: () => Promise<void>;

    // Gold & Shopping
    gold: number;
    addGold: (amount: number) => Promise<void>;
    spendGold: (amount: number) => boolean;

    // Actions
    initialize: () => void;
    selectedScenario: Scenario | null;
    selectScenario: (scenario: Scenario | null) => void;
    startBattle: (enemy: Enemy | Enemy[]) => void;
    attackEnemy: (card?: Card, targetId?: string) => Promise<void>;
    waitTurn: () => Promise<void>;
    endTurn: () => Promise<void>;
    resetBattle: () => void;

    // Inventory
    inventory: InventoryItem[];
    fetchInventory: () => Promise<void>;
    toggleEquip: (itemId: string, currentEquip: boolean, bypassLock?: boolean) => Promise<void>;
    clearStorage: () => void;

    // Equipment Bonus (store-level, updated by fetchEquipment)
    equipBonus: { atk: number; def: number; hp: number };
    equippedItems: any[]; // full equipped item objects for StatusModal
    fetchEquipment: () => Promise<void>;

    // UI State
    showStatus: boolean;
    setShowStatus: (show: boolean) => void;

    // Hand Management
    deck: Card[];
    discardPile: Card[];
    hand: Card[];
    discardCard: (index: number) => void;
    dealHand: () => void;
    useItem: (card: Card) => Promise<void>;
    useBattleItem: (item: InventoryItem) => Promise<void>; // v25: バトル中消耗品使用
    processPartyTurn: () => Promise<void>;
    processEnemyTurn: (damage?: number) => Promise<void>;

    setTarget: (enemyId: string) => void;
    setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => void;
    fleeBattle: () => void;

    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // Initialize missing defaults
            userProfile: null,
            selectedProfileId: null,
            setSelectedProfileId: (id) => set({ selectedProfileId: id }),
            worldState: null,
            hubState: null,
            gold: 1000,
            selectedScenario: null,
            inventory: [],
            deck: [],
            discardPile: [],
            hand: [],
            _hasHydrated: false,
            equipBonus: { atk: 0, def: 0, hp: 0 },
            equippedItems: [],

            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

            showStatus: false,
            setShowStatus: (show) => set({ showStatus: show }),

            fetchEquipment: async () => {
                const { userProfile } = get();
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;
                    const headers: Record<string, string> = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    if (userProfile?.id) headers['x-user-id'] = userProfile.id;
                    const res = await fetch('/api/equipment', { headers });
                    if (res.ok) {
                        const data = await res.json();
                        const bonus = data.bonus || { atk: 0, def: 0, hp: 0 };
                        set({ equipBonus: bonus, equippedItems: data.equipped || [] });
                        console.log('[fetchEquipment] store updated → equipBonus:', bonus, '装備数:', (data.equipped || []).length);
                    }
                } catch (e) {
                    console.error('[fetchEquipment] Error:', e);
                }
            },

            battleState: {
                enemy: null,
                enemies: [],
                party: [],
                turn: 1,
                current_ap: 5,
                messages: [],
                isVictory: false,
                isDefeat: false,
                currentTactic: 'Aggressive',
                player_effects: [],
                enemy_effects: [],
                exhaustPile: [],
                consumedItems: [],
                activeSupportBuffs: [],
                battleItems: [], // v25
            },

            // v3.3: initializeBattle を廃止。resetBattle() に統合済み。
            // initialize は後方互換のため残すが、内部で resetBattle を呼ぶ
            initialize: () => get().resetBattle(),

            startBattle: async (enemiesInput: Enemy | Enemy[]) => {
                const enemies = Array.isArray(enemiesInput) ? enemiesInput : [enemiesInput];
                // Initialize effects for enemies
                enemies.forEach(e => {
                    if (!e.status_effects) e.status_effects = [];
                });
                const firstEnemy = enemies[0];

                console.log("[GameStore] startBattle called with:", enemies.length, "enemies");
                // 1. Fetch Party from DB (party_members table)
                let partyMembers: PartyMember[] = [];
                const { userProfile } = get(); // Moved to top scope
                try {
                    if (userProfile?.id) {
                        const res = await fetch(`/api/party/list?owner_id=${userProfile.id}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.party) partyMembers = data.party as PartyMember[];
                        }
                    }
                } catch (e) { console.error("Party fetch failed", e); }

                // v3.4: Add Guest if exists
                const guest = useQuestState.getState().guest;
                if (guest) {
                    console.log("Guest joining battle:", guest.name);
                    partyMembers.push({ ...guest, is_active: true });
                }

                // spec_v5 §6.2: 共鳳ボーナスチェック
                // 現在拠点に過去1時間以内にアクティブな他プレイヤーがいる場合、ATK/DEF +10%
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
                    } catch (e) {
                        console.warn('[startBattle] 共鳳チェック失敗（続行）', e);
                    }
                }

                // 2. Build Deck
                // v3.3: 常に最新の inventory を取得（キャッシュに古いデータが残っている場合を考慮）
                await get().fetchInventory().catch(e => console.warn('[startBattle] fetchInventory 失敗（続行）', e));
                const { inventory, worldState } = get();

                const equippedCards = (inventory || []).filter(i => i.is_equipped && (i.is_skill || i.item_type === 'skill_card')).map(i => ({
                    id: String(i.card_id || i.id),
                    name: i.name,
                    type: (i.effect_data?.type || i.effect_data?.card_type || 'Skill') as Card['type'], // v19: DBのtypeを引き継ぎ（Support等）
                    description: i.effect_data?.description || '',
                    cost: 0,
                    power: i.effect_data?.power || i.effect_data?.effect_val || 0,
                    ap_cost: i.effect_data?.ap_cost ?? 1,         // v8.2: APコストを引き継ぐ
                    effect_id: i.effect_data?.effect_id || undefined,   // v8.2: バフ/デバフIDを引き継ぐ
                    effect_duration: i.effect_data?.effect_duration || undefined,
                    image_url: i.effect_data?.image_url || i.image_url || undefined,
                    isEquipment: true,
                }));

                const neededCardIds = new Set<string>();
                partyMembers.forEach(p => {
                    p.inject_cards?.forEach(id => neededCardIds.add(String(id)));
                });

                let partyCardPool: Card[] = [];
                // Debug: Log needed cards
                console.log("[startBattle] Needed NPC Cards:", Array.from(neededCardIds));

                // v3.3: 基本カード（1-10）も含めて一括DBフェッチ→ image_url/description を取得
                const BASIC_CARD_IDS = ['1','2','3','4','5','6','7','8','9','10'];
                const allNeededIds = new Set([...Array.from(neededCardIds), ...BASIC_CARD_IDS]);

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
                        image_url: c.image_url || undefined,  // v3.3: カード画像
                    })) as Card[];
                }

                partyMembers = partyMembers.map(pm => {
                    const sigDeck = (pm.inject_cards || []).map(id => {
                        const found = partyCardPool.find(c => c.id === String(id));
                        if (found) return found;
                        return CARD_POOL.find(c => c.id === String(id));
                    }).filter(Boolean) as Card[];

                    // バトル開始時に durability を max_hp に正規化
                    // （前回バトルの残留ダメージ・DB 不整合を解消し、常に満HP でスタート）
                    const pmAny = pm as any;
                    const fullHp = pmAny.max_hp || pmAny.hp || pm.max_durability || pm.durability || 100;

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

                // v24: 共鳳ボーナスはuserProfileを変更せず、resonanceActiveフラグで管理
                // attackEnemy/processEnemyTurnでbattleState.resonanceActiveを参照して計算

                // v24 FINAL: equipBonus をストアから直接読み取る
                // fetchEquipment() が StatusModal 起動時に store を更新済みのため Auth 問題なし
                const { equipBonus } = get();
                console.log('[startBattle] equipBonus from store:', equipBonus);




                // 祈りの加護 (Blessing Data) の適用
                let initialAp = 5;
                let blessingActive = false;
                if (userProfile?.blessing_data) {
                    const blessing = userProfile.blessing_data as any;
                    blessingActive = true;
                    initialAp += (blessing.ap_bonus || 0);

                    if (blessing.hp_pct) {
                        const maxHpBonus = Math.floor((userProfile.max_hp || 100) * blessing.hp_pct);
                        // Removed direct userProfile set() for blessing hp_pct
                    }
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

                // v24 FINAL: userProfile は DB 生値のまま保持。
                // 実効ステータスは getEffectiveAtk/Def/MaxHp() で常時計算する。
                // v25: battle 用消耗品を battleItems に抽出
                const battleItems = (get().inventory || []).filter(i =>
                    (i.item_type === 'consumable' || (i as any).type === 'consumable') &&
                    ((i as any).effect_data?.use_timing === 'battle' ||
                     (i as any).use_timing === 'battle') &&
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
                        battleItems, // v25
                    },
                    deck: shuffledDeck,
                    discardPile: [],
                    hand: []
                });

                get().dealHand();

                // サウンド: バトルBGM再生
                soundManager?.playBgm('bgm_battle');

                // --- Optimistic UI & Server Validation ---
                fetch('/api/battle/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        enemies: enemies,
                        party: partyMembers,
                        initial_ap: initialAp,
                        resonance_active: resonanceActive,
                        player_stats: { hp: userProfile?.hp, max_hp: userProfile?.max_hp, atk: userProfile?.atk, def: userProfile?.def }
                    })
                }).then(res => res.json()).then(data => {
                    if (data.battle_session_id) {
                        set(state => ({ battleState: { ...state.battleState, battle_session_id: data.battle_session_id }}));
                    }
                }).catch(err => console.error("Server Battle Sync Error", err));
            },

            endTurn: async () => {
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
                            messages: [...state.battleState.messages, '--- 30ターン経過 --- 時間切れ… 撤退を余儀なくされた。']
                        }
                    }));
                    return;
                }

                // AP 回復
                let newAp = battleState.current_ap || 0;
                if (!isStunned(battleState.player_effects as StatusEffect[])) {
                    newAp = Math.min(10, newAp + 5);
                }

                // Status Effect Tick（プレイヤー）
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
                    const { selectedProfileId } = get();
                    fetch('/api/profile/update-status', {
                        method: 'POST',
                        body: JSON.stringify({ hp: newHp, profileId: selectedProfileId })
                    }).catch(console.error);
                }

                // Status Effect Tick（エネミー全員）
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

                // ターゲット死亡 → 切り替え
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
                        // ターン番号はエネミーターン完了後に更新する
                        current_ap: newAp,
                        messages: [...state.battleState.messages, ...tickMessages],
                        player_effects: playerEffects,
                        enemies: updatedEnemies,
                        enemy: currentTarget,
                        vitDamageTakenThisTurn: false,
                    }
                }));

                if (allEnemiesDead) {
                    soundManager?.playSE('se_battle_win');
                    set(state => ({
                        battleState: { ...state.battleState, isVictory: true, battle_result: 'victory', messages: [...state.battleState.messages, '全ての敵を倒した！ 勝利！'] }
                    }));
                    return;
                }

                // NPC → エネミーターンへ
                setTimeout(() => {
                    get().processPartyTurn();
                }, 300);

            },

            resetBattle: () => {
                // v3.3: initializeBattle の重複を除去してバトル状態をリセット
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

            discardCard: (index: number) => {
                set((state) => {
                    const newHand = [...state.hand];
                    newHand.splice(index, 1);
                    return { hand: newHand };
                });
            },

            useItem: async (card: Card) => {
                get().attackEnemy(card);
            },

            // v25: バトル中消耗品使用
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
                let hasEffect = false;

                // effect_id → 日本語ラベル変換
                const effectLabel: Record<string, string> = {
                    regen: 'リジェネ', atk_up: '攻撃力アップ', def_up: '防御力アップ',
                    stun_immune: 'スタン無効', evasion_up: '回避アップ', taunt: '挑発',
                    poison: '毒', stun: 'スタン', bind: '拘束', bleed: '出血',
                    fear: '恐怖', blind: '盲目', atk_down: '攻撃力ダウ',
                };
                const effectName = (id: string) => effectLabel[id] || id;

                // 追加ログ（最後に一括で battleState.messages に追記）
                const itemMessages: string[] = [];

                // ─── ① 逃走 ───────────────────────────────────────
                if (ed.escape) {
                    hasEffect = true;
                    fleeNow = true;
                    itemMessages.push(`💨 ${item.name}を使った。煙幕に乗じて逃走した！`);
                }

                // ─── ② HP 回復 ─────────────────────────────────────
                const healAmount = ed.heal || ed.heal_hp || ed.heal_amount || 0;
                const healPct = ed.heal_pct || ed.heal_percent || 0;
                const isHealItem = !!(ed.heal_full || ed.heal_all || healAmount > 0 || healPct > 0);
                const hasOtherEffect = !!(ed.escape || ed.remove_effect || ed.effect_id);

                // HP 満タン かつ 回復しか効果がない → 消費せず早期リターン
                if (isHealItem && !hasOtherEffect && prevHp >= maxHp) {
                    set(state => ({
                        battleState: {
                            ...state.battleState,
                            messages: [...state.battleState.messages,
                                `💊 ${item.name}を使おうとしたが、HPが満タンのため使用できない！`]
                        }
                    }));
                    return;
                }

                if (!ed.escape) { // 逃走中は回復不要
                    if (ed.heal_full || ed.heal_all) {
                        hasEffect = true;
                        const healed = maxHp - prevHp;
                        newHp = maxHp;
                        itemMessages.push(`✨ ${item.name}を使用。HP が全回復した！ (+${healed}) HP: ${prevHp} → ${newHp}/${maxHp}`);
                    } else if (healAmount > 0) {
                        hasEffect = true;
                        const healed = Math.min(healAmount, maxHp - prevHp);
                        newHp = prevHp + healed;
                        itemMessages.push(`💊 ${item.name}を使用した。HP +${healed} 回復！ (HP: ${prevHp} → ${newHp}/${maxHp})`);
                    } else if (healPct > 0) {
                        hasEffect = true;
                        const healed = Math.min(Math.floor(maxHp * healPct), maxHp - prevHp);
                        newHp = prevHp + healed;
                        itemMessages.push(`💊 ${item.name}を使用した。HP +${healed} 回復！ (HP: ${prevHp} → ${newHp}/${maxHp})`);
                    }
                }

                // ─── ③ 状態異常解除 ────────────────────────────────
                if (ed.remove_effect) {
                    hasEffect = true;
                    const existed = newPlayerEffects.some((e: any) => e.id === ed.remove_effect);
                    newPlayerEffects = newPlayerEffects.filter((e: any) => e.id !== ed.remove_effect);
                    if (existed) {
                        itemMessages.push(`🌿 ${item.name}を使用。状態異常「${effectName(ed.remove_effect)}」を解除した！`);
                    } else {
                        itemMessages.push(`🌿 ${item.name}を使用したが、その状態異常は付与されていない。`);
                    }
                }

                // ─── ④ バフ/デバフ (effect_id) ─────────────────────
                if (ed.effect_id) {
                    hasEffect = true;
                    const duration = ed.effect_duration ?? 3;
                    const isEnemy = ed.target === 'enemy';
                    const isSelfBuff = ['regen', 'atk_up', 'def_up', 'stun_immune', 'evasion_up', 'taunt'].includes(ed.effect_id);

                    if (isEnemy) {
                        // 敵へのデバフ付与
                        newEnemyEffects = [...newEnemyEffects, { id: ed.effect_id, duration }];
                        itemMessages.push(`🔮 ${item.name}を投げつけた！ 敵に「${effectName(ed.effect_id)}」を付与した！(${duration}ターン)`);
                    } else if (isSelfBuff) {
                        // 自身へのバフ付与（重複は上書き）
                        newPlayerEffects = [
                            ...newPlayerEffects.filter((e: any) => e.id !== ed.effect_id),
                            { id: ed.effect_id, duration }
                        ];
                        itemMessages.push(`✨ ${item.name}の効果で「${effectName(ed.effect_id)}」が付与された！(${duration}ターン)`);
                    } else {
                        // 未知の効果 → 汎用
                        newPlayerEffects = [...newPlayerEffects, { id: ed.effect_id, duration }];
                        itemMessages.push(`✨ ${item.name}を使用。「${effectName(ed.effect_id)}」が発動した！(${duration}ターン)`);
                    }
                }

                // ─── ⑤ 何も起きなかった ─────────────────────────────
                if (!hasEffect) {
                    itemMessages.push(`（${item.name}を使用したが、何も起きなかった…）`);
                    console.warn('[useBattleItem] No recognized effect_data keys for item:', item.name, ed);
                }

                // HP バー同期マーカー（HP が変動した場合のみ）
                if (newHp !== prevHp) {
                    itemMessages.push(`__hp_sync:${newHp}`);
                }

                // 数量減算（楽観的更新）
                const newBattleItems = battleState.battleItems.map(bi =>
                    bi.id === item.id ? { ...bi, quantity: (bi.quantity || 1) - 1 } : bi
                );

                // state updater を使って messages を安全に追記（レース条件回避）
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

                // API コール（非同期・失敗しても続行）
                const session = await supabase.auth.getSession();
                fetch('/api/item/use', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.data.session?.access_token || ''}`
                    },
                    body: JSON.stringify({ inventory_id: item.id, use_context: 'battle' })
                }).catch(e => console.warn('[useBattleItem] API同期失敗（続行）', e));

                // 逃走実行
                if (fleeNow) {
                    await new Promise(r => setTimeout(r, 800));
                    get().fleeBattle();
                }
            },

            selectScenario: (scenario) => set({ selectedScenario: scenario }),

            addGold: async (amount) => {
                const { gold, userProfile } = get();
                const newGold = gold + amount;
                set({ gold: newGold });

                if (userProfile?.id) {
                    try {
                        const res = await fetch('/api/debug/add-gold', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userProfile.id, amount })
                        });
                        if (res.ok) {
                            const data = await res.json();
                            set({ gold: data.new_gold });
                        }
                    } catch (e) {
                        console.error('Failed to add gold via API', e);
                    }
                }
            },

            spendGold: (amount) => {
                const { gold } = get();
                if (gold >= amount) {
                    set({ gold: gold - amount });
                    return true;
                }
                return false;
            },

            dealHand: () => {
                const { deck, discardPile, hand, battleState, userProfile } = get();

                // v2.11 Struggle (あがき) — ドロー開始時に全カード0枚なら救済
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

                // Phase 1.5: spec_v8準拠のレベル連動Hand Size
                // Lv1-9: 3枚 / Lv10-19: 4枚 / Lv20+: 5枚
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
                        if (currentDiscard.length === 0) break; // No cards left
                        // Recycle Discard -> Deck
                        currentDeck = [...currentDiscard].sort(() => 0.5 - Math.random());
                        currentDiscard = [];
                    }
                    const card = currentDeck.pop();
                    if (card) newHand.push(card);
                }

                set({
                    deck: currentDeck,
                    discardPile: currentDiscard,
                    hand: newHand
                });
            },

            fetchWorldState: async () => {
                try {
                    // Update Hub State first to know context
                    await get().fetchHubState();
                    const { userProfile, hubState } = get();

                    // current_location_id からロケーション名を取得
                    // 帰還時（is_in_hub=true）は「名もなき旅人の拠所」をハブとして使い、
                    // current_location_id は直前の拠点を保持するため変更しない
                    let targetLocationName = '国境の町'; // フォールバック

                    if (hubState?.is_in_hub) {
                        // ハブ（名もなき旅人の拠所）にいる場合
                        targetLocationName = '名もなき旅人の拠所';
                    } else if (userProfile?.current_location_id) {
                        // current_location_idがある場合はDBから実際の拠点名を取得
                        if (userProfile.locations?.name) {
                            // JOINされたlocation情報がある場合はそれを優先
                            targetLocationName = userProfile.locations.name;
                        } else {
                            // JOINがない場合はlocationsテーブルから直接取得（ID or slug で検索）
                            const locId = userProfile.current_location_id;
                            const { data: locData } = await supabase
                                .from('locations')
                                .select('name')
                                .or(`id.eq.${locId},slug.eq.${locId}`)
                                .maybeSingle();
                            if (locData?.name) {
                                targetLocationName = locData.name;
                            }
                        }
                    } else if (userProfile?.locations?.name) {
                        targetLocationName = userProfile.locations.name;
                    }

                    console.log("Fetching World State for:", targetLocationName);

                    // New Scheme: Query by LOCATION_NAME
                    const { data, error } = await supabase
                        .from('world_states')
                        .select('*')
                        .eq('location_name', targetLocationName)
                        .maybeSingle(); // Use maybeSingle to avoid 406 error if missing

                    // --- New logic: Fetch Hegemony ---
                    let hegemonyData = [];
                    try {
                        const hegemonyRes = await fetch('/api/world/hegemony', { cache: 'no-store' });
                        if (hegemonyRes.ok) {
                            const hData = await hegemonyRes.json();
                            hegemonyData = hData.hegemony || [];
                        }
                    } catch (e) { console.error('Hegemony fetch error', e); }
                    // ---

                    if (data && !error) {
                        set({ worldState: { ...(data as WorldState), hegemony: hegemonyData } });
                    } else {
                        console.warn(`fetchWorldState failed for ${targetLocationName}, attempting auto-initialization...`);

                        // Attempt to initialize the missing row via our API
                        try {
                            const initRes = await fetch('/api/admin/update-world', {
                                method: 'POST',
                                headers: { 'Cache-Control': 'no-cache' },
                                body: JSON.stringify({ location_name: targetLocationName }),
                                cache: 'no-store'
                            });

                            if (initRes.ok) {
                                console.log("Auto-initialization successful. Refetching...");
                                const { data: newData } = await supabase
                                    .from('world_states')
                                    .select('*')
                                    .eq('location_name', targetLocationName)
                                    .maybeSingle();

                                if (newData) {
                                    set({ worldState: { ...(newData as WorldState), hegemony: hegemonyData } });
                                    return;
                                }
                            }
                        } catch (initErr) {
                            console.error("Auto-initialization API call failed", initErr);
                        }

                        // Fallback / Initial State if DB is empty or error and init failed
                        console.warn("Using fallback local state.");
                        const dummyState: WorldState = {
                            location_name: targetLocationName,
                            status: '繁栄', // Default per new schema
                            prosperity_level: 3,
                            order_score: 10,
                            chaos_score: 10,
                            justice_score: 10,
                            evil_score: 10,
                            attribute_name: '至高の平穏',
                            flavor_text: '新たな土地は静寂に包まれている。',
                            background_url: '/backgrounds/default.jpg',
                            total_days_passed: 0,
                            controlling_nation: 'Neutral',
                            hegemony: hegemonyData
                        };
                        set({ worldState: dummyState });
                    }
                } catch (e) {
                    console.error("Failed to fetch world state", e);
                }
            },

            fetchUserProfile: async () => {
                try {
                    const { selectedProfileId } = get();
                    const url = selectedProfileId
                        ? `/api/profile?profileId=${selectedProfileId}`
                        : '/api/profile';

                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;

                    const headers: HeadersInit = { 'Cache-Control': 'no-store' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const res = await fetch(url, { cache: 'no-store', headers });
                    if (res.ok) {
                        const profile = await res.json();
                        // v24: userProfile は常に DB 生値。実効値は getEffectiveAtk/Def/MaxHp() で計算。
                        set({ userProfile: profile, gold: profile.gold });

                        // v13.1: 装備ボーナスをプロフィール取得後に自動初期化
                        // StatusModal を開かなくてもバトルで equipBonus が有効になる
                        get().fetchEquipment().catch(e =>
                            console.warn('[fetchUserProfile] fetchEquipment 自動呼び出し失敗（無害）', e)
                        );
                    }
                } catch (e) {
                    console.error("Failed to fetch profile", e);
                }
            },



            fetchHubState: async () => {
                try {
                    const { userProfile } = get();
                    if (!userProfile?.id) return;

                    const { data, error } = await supabase
                        .from('user_hub_states')
                        .select('*')
                        .eq('user_id', userProfile.id)
                        .maybeSingle();

                    if (data) {
                        set({ hubState: data as UserHubState });
                    } else if (!error) {
                        // Create default if missing (lazy create)
                        const { data: newData, error: insertError } = await supabase
                            .from('user_hub_states')
                            .insert([{ user_id: userProfile.id, is_in_hub: false }])
                            .select()
                            .single();

                        if (newData) set({ hubState: newData as UserHubState });
                        else console.warn("Failed to init hub state", insertError);
                    }
                } catch (e) {
                    console.error("Failed to fetch hub state", e);
                }
            },

            // --- Inventory Actions ---
            fetchInventory: async () => {
                try {
                    const { userProfile } = get();
                    const { data: { session } } = await supabase.auth.getSession();
                    const headers: HeadersInit = {};
                    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
                    if (userProfile?.id) headers['x-user-id'] = userProfile.id;

                    const res = await fetch('/api/inventory', {
                        headers,
                        cache: 'no-store'
                    });
                    if (res.ok) {
                        const { inventory } = await res.json();
                        set({ inventory });
                    }
                } catch (e) {
                    console.error("Failed to fetch inventory", e);
                }
            },

            toggleEquip: async (itemId: string, currentEquip: boolean, bypassLock?: boolean) => {
                try {
                    // Optimistic update
                    const { inventory } = get();
                    const targetItem = inventory.find(i => String(i.id) === itemId);
                    const newInventory = inventory.map(i =>
                        String(i.id) === itemId ? { ...i, is_equipped: !currentEquip } : i
                    );
                    set({ inventory: newInventory });

                    const { userProfile } = get();
                    const { data: { session } } = await supabase.auth.getSession();
                    const headers: HeadersInit = { 'Content-Type': 'application/json' };
                    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
                    if (userProfile?.id) headers['x-user-id'] = userProfile.id;

                    // v5.2: スキルかアイテムかを判定し、API に is_skill フラグを渡す
                    const isSkill = targetItem?.is_skill || targetItem?.item_type === 'skill_card';

                    await fetch('/api/inventory', {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify({
                            inventory_id: itemId,
                            is_equipped: !currentEquip,
                            bypass_lock: bypassLock,
                            is_skill: isSkill,
                        }),
                        cache: 'no-store'
                    });
                } catch (e) {
                    console.error("Failed to toggle equip", e);
                }
            },

            attackEnemy: async (card?: Card, targetId?: string) => {
                const { battleState, selectedScenario, hand, userProfile } = get();

                // v24 FINAL: 実効ATKを getEffectiveAtk() で計算（equipBonus + resonanceActive 込み）
                const effectivePlayerAtk = getEffectiveAtk(userProfile, battleState);
                const effectivePlayerMaxHp = getEffectiveMaxHp(userProfile, battleState);
                console.log('[attackEnemy] DEBUG: base ATK=', userProfile?.atk, 'equipBonus=', battleState.equipBonus, 'resonance=', battleState.resonanceActive, '→ effectiveATK=', effectivePlayerAtk);

                // v3.5: Check if any enemy is alive
                const anyAlive = battleState.enemies?.some(e => e.hp > 0);
                if (!anyAlive || battleState.isVictory || battleState.isDefeat) return;

                // Resolve Target
                let targetEnemyId = targetId || battleState.enemy?.id;
                let targetEnemy = battleState.enemies.find(e => e.id === targetEnemyId);

                // Fallback to first living enemy if current target is dead/invalid
                if (!targetEnemy || targetEnemy.hp <= 0) {
                    targetEnemy = battleState.enemies.find(e => e.hp > 0);
                    targetEnemyId = targetEnemy?.id;
                }

                if (!targetEnemy) return;

                // v2.7: Validation
                if (card) {
                    const resolvedTargetId = targetId || getDefaultTarget(card, battleState);
                    const validation = validateCardUse(card, resolvedTargetId, battleState);
                    if (!validation.valid) {
                        set(state => ({ battleState: { ...state.battleState, messages: [...state.battleState.messages, validation.error || '行動できません'] } }));
                        return;
                    }
                    const apCost = card.ap_cost ?? 1;
                    set(state => ({ battleState: { ...state.battleState, current_ap: (battleState.current_ap || 0) - apCost } }));

                    // cost_type=item: 1バトル1回制限チェック
                    if (card.cost_type === 'item') {
                        const baseId = card.id.match(/^(\d+)/)?.[1] || card.id;
                        if (battleState.consumedItems?.some(cid => cid.startsWith(baseId))) {
                            // AP返却して使用ブロック
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

                console.log("[Attack] Card used:", card);

                // --- Server Validation Call ---
                if (card && battleState.battle_session_id) {
                    fetch('/api/battle/action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            battle_session_id: battleState.battle_session_id,
                            action_type: 'attack_enemy',
                            card: card,
                            target_id: targetEnemyId,
                            log_message: `Used ${card?.name}`
                        })
                    }).then(res => res.json()).then(data => {
                        if (data.error) {
                            console.warn('Server validation failed:', data.error);
                            set(state => ({ battleState: { ...state.battleState, messages: [...state.battleState.messages, `[サーバー未承認] ${data.error}`] }}));
                        }
                    });
                }
                // ------------------------------

                let nextHand = [...hand];
                let nextDiscardPile = [...get().discardPile];
                let logMsg = '';
                let healSyncHp: number | null = null; // v3.3: HPバー同期用（回復時）
                let damage = 0;
                let isAoe = false;
                let effectInfo: ReturnType<typeof getCardEffectInfo> | undefined;

                // Noise logic (unchanged)
                if (card && (card.type === 'noise' || card.type === 'Basic' && card.name === 'Noise')) {
                    const purgeCost = card.discard_cost ?? 1;
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
                    // Bleed logic (unchanged)
                    const bleedDmg = getBleedDamage(battleState.player_effects as StatusEffect[]);
                    if (bleedDmg > 0 && userProfile) {
                        const newHp = Math.max(0, (userProfile.hp || 0) - bleedDmg);
                        set(state => ({
                            userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                            battleState: { ...state.battleState, messages: [...state.battleState.messages, `出血ダメージ！ HP -${bleedDmg}`] }
                        }));
                    }

                    // Struggle logic (unchanged)
                    if (card.id === 'struggle' && userProfile) {
                        const selfDmg = 1;
                        const newHp = Math.max(0, (userProfile.hp || 0) - selfDmg);
                        set(state => ({
                            userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                            battleState: { ...state.battleState, messages: [...state.battleState.messages, `あがきの反動！ HP -${selfDmg}`] }
                        }));
                    }

                    // ─── カード効果分岐エンジン ───────────────────
                    effectInfo = getCardEffectInfo(card);

                    // サウンド: カードエフェクトに応じたSE再生
                    soundManager?.playSEForCardEffect(effectInfo.effectType);

                    switch (effectInfo.effectType) {
                        case 'heal': {
                            // v3.3: card.power が undefined の場合も effect_val / 20 でフォールバック
                            const healAmount = (card as any).effect_val ?? card.power ?? 20;
                            if (userProfile && healAmount > 0) {
                                const maxHp = effectivePlayerMaxHp;
                                const newHp = Math.min(maxHp, (userProfile.hp || 0) + healAmount);
                                set(state => ({
                                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null,
                                }));
                                logMsg = `♥ ${card.name}で HP +${healAmount} 回復！ (${newHp}/${maxHp})`;
                                healSyncHp = newHp; // v3.3: HPバー同期用
                                const { selectedProfileId } = get();
                                fetch('/api/profile/update-status', {
                                    method: 'POST',
                                    body: JSON.stringify({ hp: newHp, profileId: selectedProfileId })
                                }).catch(console.error);
                            } else {
                                logMsg = `${card.name}を使用！(体力は満たんでいる)`;
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
                                battleState: {
                                    ...state.battleState,
                                    isDefeat: true,
                                    battle_result: 'escape',
                                    messages: [...state.battleState.messages, logMsg]
                                }
                            }));
                            return; // 即座に終了
                        }
                        case 'buff_self': {
                            if (effectInfo.effectId) {
                                // v3.0: def_up/def_up_heavy は defValue を value として渡す（固定値DEF加算）
                                const defValue = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                                    ? (effectInfo.defValue ?? card.power ?? 10)
                                    : undefined;
                                const newEffects = applyEffect(
                                    battleState.player_effects as StatusEffect[],
                                    effectInfo.effectId,
                                    effectInfo.effectDuration || 3,
                                    defValue
                                );
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                                
                                if (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy') {
                                    logMsg = `${card.name}を使用！ DEF +${defValue} (${effectInfo.effectDuration || 3}T)！`;
                                } else {
                                    logMsg = `${card.name}を使用！ ${getEffectName(effectInfo.effectId)}を得た！`;
                                }
                            } else {
                                logMsg = `${card.name}を使用！`;
                            }
                            break;
                        }
                        case 'taunt': {
                            if (effectInfo.effectId) {
                                const newEffects = applyEffect(
                                    battleState.player_effects as StatusEffect[],
                                    effectInfo.effectId,
                                    effectInfo.effectDuration || 2
                                );
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                            }
                            const sourceName = card.source?.replace('Party:', '') || 'パーティメンバー';
                            logMsg = `${sourceName}が${card.name}！ 敵の攻撃を引きつけた！`;
                            break;
                        }
                        case 'buff_party': {
                            if (effectInfo.effectId) {
                                // v3.0: def_up/def_up_heavy は defValue を value として渡す（固定値DEF加算）
                                const defValue = (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy')
                                    ? (effectInfo.defValue ?? 0)
                                    : undefined;
                                const newEffects = applyEffect(
                                    battleState.player_effects as StatusEffect[],
                                    effectInfo.effectId,
                                    effectInfo.effectDuration || 3,
                                    defValue
                                );
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                            }
                            if (effectInfo.effectId === 'def_up' || effectInfo.effectId === 'def_up_heavy') {
                                logMsg = `${card.name}を展開！ パーティ全体のDEF +${effectInfo.defValue ?? 0} (${effectInfo.effectDuration || 3}T)！`;
                            } else {
                                logMsg = `${card.name}を展開！ パーティ全体が守られた！`;
                            }
                            break;
                        }
                        case 'aoe_attack': {
                            damage = card.power ?? 0;
                            if (damage > 0) {
                                const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic');
                                // AoEは最も硬い敵のDEFで計算（最低保証）
                                damage = calculateDamage(
                                    damage, 0,
                                    battleState.player_effects as StatusEffect[],
                                    [],
                                    isMagic,
                                    effectivePlayerAtk
                                );
                            }
                            logMsg = `${card.name}で全体攻撃！ 各敵に ${damage} のダメージ！`;
                            isAoe = true;
                            break;
                        }
                        case 'debuff_enemy': {
                            // デバフ系: ダメージは0でも効果を付与
                            damage = card.power ?? 0;
                            if (damage > 0) {
                                const isMagic = true; // デバフは魔法扱い（DEF貫通）
                                damage = calculateDamage(
                                    damage, targetEnemy.def || 0,
                                    battleState.player_effects as StatusEffect[],
                                    targetEnemy.status_effects as StatusEffect[] || [],
                                    isMagic, effectivePlayerAtk
                                );
                                logMsg = `${targetEnemy.name}に${card.name}！ ${damage} ダメージ！`;
                            } else {
                                const effectName = effectInfo.effectId ? getEffectName(effectInfo.effectId) : card.name;
                                logMsg = `${targetEnemy.name}に${card.name}を使用！ ${effectName}を付与！`;
                            }
                            break;
                        }
                        default: { // 'attack'
                            damage = card.power ?? 0;
                            if (damage > 0) {
                                const isMagic = card.name.includes('魔法') || card.name.toLowerCase().includes('magic') || card.name.toLowerCase().includes('fire');
                                damage = calculateDamage(
                                    damage,
                                    targetEnemy.def || 0,
                                    battleState.player_effects as StatusEffect[],
                                    targetEnemy.status_effects as StatusEffect[] || [],
                                    isMagic,
                                    effectivePlayerAtk
                                );
                                logMsg = `${targetEnemy.name}に${card.name}を使用！ ${damage} のダメージ！`;
                            } else {
                                logMsg = `${card.name}を使用！`;
                            }
                            break;
                        }
                        case 'support_activate': {
                            // v19: Supportカード使用 → バトル内永続バフ付与
                            const passiveLabel = getPassiveLabel(card.id);
                            // activeSupportBuffs にカードIDを追加（重複防止）
                            const currentBuffs = get().battleState.activeSupportBuffs || [];
                            if (!currentBuffs.includes(card.id)) {
                                set(state => ({
                                    battleState: {
                                        ...state.battleState,
                                        activeSupportBuffs: [...(state.battleState.activeSupportBuffs || []), card.id],
                                    }
                                }));
                            }
                            // v3.2: effectId があれば player_effects にも追加（バッジ・ステータス表示のため）
                            if (effectInfo.effectId) {
                                const newEffects = applyEffect(
                                    get().battleState.player_effects as StatusEffect[],
                                    effectInfo.effectId,
                                    effectInfo.effectDuration || 3
                                );
                                set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                                logMsg = `✨ ${card.name}を発動！ ${getEffectName(effectInfo.effectId)}(${effectInfo.effectDuration || 3}T) ${passiveLabel}`;
                            } else {
                                logMsg = `✨ ${card.name}を発動！ ${passiveLabel}（バトル終了まで）`;
                            }
                            break;
                        }
                    }

                    // ─── Card Cycle ────────────────────────────
                    nextHand = nextHand.filter(c => c.id !== card.id);
                    if ((card.type === 'Item' && card.isEquipment) || card.cost_type === 'item' || card.type === 'Support') {
                        // 装備品カード / cost_type=item / Supportカード → exhaust（再利用不可）
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

                    // ─── Effect Application (effectInfo経由) ──
                    // buff_self/taunt/buff_party/heal は switch 内で処理済み
                    // attack/aoe_attack/debuff_enemy の場合のみ敵にeffect付与
                    if (!effectInfo.skipDamage && effectInfo.effectId) {
                        const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(effectInfo.effectId);
                        if (isSelfBuff) {
                            const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectInfo.effectId, effectInfo.effectDuration || 3);
                            set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        }
                    }
                    // card.effect_id（既存カードのeffect_id属性）も引き続きサポート
                    if (card.effect_id && !effectInfo.effectId) {
                        const effectId = card.effect_id as StatusEffectId;
                        const duration = card.effect_duration || 3;
                        const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(effectId);
                        if (isSelfBuff) {
                            const newEffects = applyEffect(battleState.player_effects as StatusEffect[], effectId, duration);
                            set(state => ({ battleState: { ...state.battleState, player_effects: newEffects } }));
                        }
                    }
                }

                // ─── Apply Damage & Effects to Enemies ────
                let newEnemies = battleState.enemies.map(e => {
                    // AoE: 全生存敵にダメージ
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
                    // 単体ターゲット
                    if (e.id === targetEnemyId) {
                        let newHp = Math.max(0, e.hp - damage);
                        let newEffects = (e.status_effects || []) as StatusEffect[];
                        // effectInfo 経由のデバフ付与
                        const resolvedEffectId = effectInfo?.effectId || (card?.effect_id as StatusEffectId | undefined);
                        if (resolvedEffectId) {
                            const isSelfBuff = ['atk_up', 'def_up', 'regen', 'stun_immune'].includes(resolvedEffectId);
                            if (!isSelfBuff) {
                                // v3.2: stun/bind は「付与されたターンの次のターン確実に1回行動不能」にするため
                                // duration を +1 して endTurn tick 消費後に有効期間が残るようにする
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
                // v3.3: heal case のHPバー同期マーカー（回復時にliveHpを増やす）
                if (healSyncHp !== null) {
                    newMessages.push(`__hp_sync:${healSyncHp}`);
                }
                // v3.2: ダメージ＋効果付与時は次のメッセージに効果名を追記
                if (damage > 0) {
                    const resolvedEffectIdForLog = effectInfo?.effectId || (card?.effect_id as string | undefined);
                    if (resolvedEffectIdForLog && !['atk_up', 'def_up', 'def_up_heavy', 'regen', 'stun_immune', 'evasion_up'].includes(resolvedEffectIdForLog)) {
                        const eName = getEffectName(resolvedEffectIdForLog as any);
                        newMessages.push(`→ ${targetEnemy?.name}に「${eName}」を付与した！`);
                    }
                }
                if (isTargetDead) {
                    newMessages.push(`${targetEnemy.name}を倒した！`);

                    // Drop Check (v2.6)
                    if (updatedTargetEnemy?.drop_rate && updatedTargetEnemy.drop_item_slug && Math.random() * 100 < updatedTargetEnemy.drop_rate) {
                        newMessages.push(`${updatedTargetEnemy.name}が「${updatedTargetEnemy.drop_item_slug}」を落とした！`);

                        // Add to inventory via API
                        const dropSlug = updatedTargetEnemy.drop_item_slug;
                        const { userProfile } = get();
                        const headers: HeadersInit = { 'Content-Type': 'application/json' };
                        if (userProfile?.id) headers['x-user-id'] = userProfile.id;

                        fetch('/api/inventory', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ item_slug: dropSlug, quantity: 1 })
                        }).then(res => {
                            if (res.ok) {
                                // Optionally refresh inventory locally if needed, but fetchInventory is called elsewhere usually
                                // usage: get().fetchInventory(); (if we want immediate update)
                            }
                        }).catch(err => console.error("Drop add failed", err));
                    }
                }

                if (allDead) {
                    newMessages.push('全ての敵を倒した！ 勝利！');
                    try {
                        const reportPayload = {
                            action: 'victory',
                            impacts: selectedScenario?.impacts,
                            scenario_id: selectedScenario?.id
                        };
                        fetch('/api/report-action', { method: 'POST', body: JSON.stringify(reportPayload) });
                        get().fetchWorldState();
                        get().fetchUserProfile();
                        // Gold reward...
                        const partyCount = (get().battleState.party?.length || 0) + 1;
                        const gold = selectedScenario?.reward_gold || 50;
                        get().addGold(Math.floor(gold / partyCount));

                        // Consumed items sync...
                        const consumed = get().battleState.consumedItems || [];
                        consumed.forEach(cid => fetch('/api/battle/use-item', { method: 'POST', body: JSON.stringify({ inventory_id: cid }) }));
                    } catch (e) { console.error(e); }
                }

                // Update State
                set((state) => ({
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
                // endTurn の set() 後に processPartyTurn が呼ばれるが、
                // 非同期 await がある場合のスナップショット汚染を防ぐため
                // 冒頭で一度だけ取得し、await 後は freshBattle で上書きする
                const initialBattle = get().battleState;
                if (initialBattle.isVictory || initialBattle.isDefeat || !initialBattle.enemy) return;

                let party = [...initialBattle.party];

                // v25: signature_deck が空のメンバーを inject_cards から再解決
                // （persist/hydrationで Card[] が失われた場合のリカバリ）
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
                            if (pm.signature_deck && pm.signature_deck.length > 0) return pm; // 既に解決済み
                            const resolved = pm.inject_cards
                                .map(id => dbCards.find(c => String(c.id) === String(id)))
                                .filter(Boolean)
                                .map(c => ({
                                    id: String(c!.id),
                                    slug: c!.slug,
                                    name: c!.name,
                                    type: c!.type,
                                    description: c!.description || '',
                                    cost: c!.cost_val ?? c!.cost ?? 0,
                                    power: c!.effect_val ?? c!.power ?? 0,
                                    ap_cost: c!.ap_cost ?? 1,
                                    effect_id: c!.effect_id ?? undefined,
                                    effect_duration: c!.effect_duration ?? undefined,
                                    image_url: c!.image_url ?? undefined,
                                })) as Card[];
                            console.log(`[processPartyTurn] ${pm.name} deck restored: ${resolved.length} cards`);
                            return {
                                ...pm,
                                signature_deck: resolved,
                                ai_role: determineRole({ ...pm, signature_deck: resolved }),
                                ai_grade: determineGrade(pm),
                                current_ap: pm.current_ap ?? 5,
                                used_this_turn: [],
                            };
                        });
                    }
                }

                // await 後に最新の battleState を再取得（endTurn の tick 更新を反映）
                const freshBattle = get().battleState;
                if (freshBattle.isVictory || freshBattle.isDefeat || !freshBattle.enemy) return;

                let newMessages = [...freshBattle.messages];
                let enemyHp = freshBattle.enemy.hp;
                const enemyDef = freshBattle.enemy.def || 0;
                const updatedParty = [...party];

                console.log(`[processPartyTurn] Processing ${updatedParty.length} party members`);

                for (let i = 0; i < updatedParty.length; i++) {
                    let member = { ...updatedParty[i] };
                    // 非アクティブ or 戦闘不能はスキップ
                    if (!member.is_active || (member.durability ?? 100) <= 0) {
                        console.log(`[processPartyTurn] Skip ${member.name}: inactive or down`);
                        continue;
                    }

                    // ターン開始時に使用済みカード履歴をリセット
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
                    console.log(`[processPartyTurn] ${member.name}: ${actions.length} actions (deck: ${member.signature_deck?.length ?? 0} cards)`);

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
                                set(state => ({
                                    userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                                }));
                                fetch('/api/profile/update-status', { method: 'POST', body: JSON.stringify({ hp: newHp }) }).catch(console.error);
                                newMessages.push(`__hp_sync:${newHp}`);
                            } else {
                                const targetIdx = updatedParty.findIndex(m =>
                                    m.name === action.targetName || (action.targetName === member.name && m.id === member.id)
                                );
                                const healTarget = targetIdx >= 0 ? updatedParty[targetIdx] : member;
                                const newDur = Math.min(
                                    healTarget.max_durability || healTarget.durability || 100,
                                    (healTarget.durability || 0) + action.healAmount
                                );
                                if (targetIdx >= 0) {
                                    updatedParty[targetIdx] = { ...healTarget, durability: newDur };
                                } else {
                                    member = { ...member, durability: newDur };
                                    updatedParty[i] = member;
                                }
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
                                member = {
                                    ...member,
                                    status_effects: [
                                        ...((member.status_effects || []) as StatusEffect[]).filter(e => e.id !== effectId),
                                        { id: effectId, duration }
                                    ]
                                };
                                updatedParty[i] = member;
                            } else {
                                const currentEffects = get().battleState.enemy_effects as StatusEffect[];
                                const newEffects = applyEffect(currentEffects, effectId, duration);
                                set(state => ({ battleState: { ...state.battleState, enemy_effects: newEffects } }));
                            }
                        }

                        if (enemyHp <= 0) break;
                    }

                    // AP 状態を反映
                    updatedParty[i] = { ...member, current_ap: member.current_ap };

                    if (enemyHp <= 0) break; // 全滅済みなら残りメンバーもスキップ
                }

                // 現ターゲットの HP を enemies 配列に反映
                let updatedEnemies = [...(get().battleState.enemies || [])].map(e =>
                    e.id === freshBattle.enemy?.id ? { ...e, hp: enemyHp } : e
                );

                const allEnemiesDead = updatedEnemies.every(e => e.hp <= 0);

                let nextTarget = freshBattle.enemy ? { ...freshBattle.enemy, hp: enemyHp } : null;
                if (enemyHp <= 0 && !allEnemiesDead) {
                    const firstAlive = updatedEnemies.find(e => e.hp > 0);
                    if (firstAlive) {
                        nextTarget = firstAlive;
                        newMessages.push(`ターゲットを ${firstAlive.name} に切り替えた。`);
                    }
                }

                set(state => ({
                    battleState: {
                        ...state.battleState,
                        enemy: nextTarget,
                        enemies: updatedEnemies,
                        party: updatedParty,
                        messages: newMessages
                    }
                }));

                if (allEnemiesDead) {
                    const { selectedScenario } = get();
                    const finalMessages = [...newMessages, 'パーティの活躍により、宿敵を打ち倒した！ 勝利！'];

                    try {
                        const reportPayload = {
                            action: 'victory',
                            impacts: selectedScenario?.impacts,
                            scenario_id: selectedScenario?.id
                        };
                        await fetch('/api/report-action', { method: 'POST', body: JSON.stringify(reportPayload) });
                        await get().fetchWorldState();
                        await get().fetchUserProfile();

                        const partyCount = (initialBattle.party.length || 0) + 1;
                        const rewardGold = selectedScenario?.reward_gold || 50;
                        const reward = Math.floor(rewardGold / partyCount);
                        get().addGold(reward);

                        finalMessages.push(`報酬 金貨 ${rewardGold} 枚を獲得。`);
                        if (partyCount > 1) finalMessages.push(`(パーティ分配: 1人あたり ${reward} 枚)`);

                        fetch('/api/profile/update-status', {
                            method: 'POST',
                            body: JSON.stringify({ gold: get().gold })
                        }).catch(console.error);

                        finalMessages.push('あなたの活躍が、世界の情勢に微かな変化をもたらしました。');
                    } catch (e) { console.error(e); }

                    set(state => ({
                        battleState: { ...state.battleState, isVictory: true, messages: finalMessages }
                    }));
                    return;
                }

                // エネミーターンへ
                setTimeout(() => {
                    get().processEnemyTurn();
                }, 600);
            },

            processEnemyTurn: async (unusedDamage?: number) => {
                const { battleState, userProfile } = get();
                // Filter living enemies
                const enemies = battleState.enemies ? battleState.enemies.filter(e => e.hp > 0) : [];
                if (enemies.length === 0 && !battleState.enemy) return;

                // Fallback for old state if enemies array is missing matching enemy
                const activeEnemies = enemies.length > 0 ? enemies : (battleState.enemy ? [battleState.enemy] : []);
                // v20: 敵のHP変動をトラッキング（回復スキル等）
                let updatedEnemies = [...(battleState.enemies || [])];

                let newMessages = [...battleState.messages];
                let newParty = [...battleState.party];
                let newUserProfile = userProfile ? { ...userProfile } : null;
                let vitDamageTaken = battleState.vitDamageTakenThisTurn;

                // Loop through all living enemies
                for (const enemy of activeEnemies) {
                    // ─── v3.0: スタン/拘束中のスキップ ───────────────
                    const enemyStatusEffects = (enemy.status_effects || []) as StatusEffect[];
                    if (isStunned(enemyStatusEffects)) {
                        newMessages.push(`${enemy.name}はスタン状態で行動できない！`);
                        continue;
                    }

                    newMessages.push(`${enemy.name}の行動！`);

                    // ─── v20: AI Action Pattern Engine ───────────────
                    const actions = (enemy as any).action_pattern || [];
                    let selectedSkillSlug: string | null = null;
                    let applyStun = false;
                    let isDrainVit = false;

                    if (actions.length > 0) {
                        // 1. Filter actions by condition
                        const validActions = actions.filter((a: any) => {
                            if (!a.condition) return true;
                            const parts = String(a.condition).split(':');
                            const condType = parts[0];
                            const condVal = Number(parts[1]) || 0;
                            switch (condType) {
                                case 'turn_mod':
                                    return battleState.turn > 0 && battleState.turn % condVal === 0;
                                case 'hp_under':
                                    return enemy.hp < enemy.maxHp * (condVal / 100);
                                default:
                                    return true;
                            }
                        });

                        // 2. Weighted random selection from valid actions
                        if (validActions.length > 0) {
                            const totalProb = validActions.reduce((sum: number, a: any) => sum + (a.prob || 0), 0);
                            let roll = Math.floor(Math.random() * totalProb);
                            for (const action of validActions) {
                                roll -= (action.prob || 0);
                                if (roll < 0) {
                                    selectedSkillSlug = action.skill;
                                    break;
                                }
                            }
                            // Safety: pick last if roll somehow didn't match
                            if (!selectedSkillSlug) selectedSkillSlug = validActions[validActions.length - 1].skill;
                        }
                    }

                    // 3. Resolve skill from dictionary
                    const skillDef = selectedSkillSlug ? getEnemySkill(selectedSkillSlug) : null;

                    // 4. Calculate action result
                    let enemyAtk = 0;

                    if (skillDef) {
                        // Skill-based action
                        const baseAtk = (enemy.level || 1) * 3 + 5;

                        switch (skillDef.effect_type) {
                            case 'damage': {
                                // v3.0: atk_down → 敵ATK × 0.7
                                const atkDownMod = getAtkDownMod(enemyStatusEffects);
                                enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                                // Special: stun for boss_stun or god_purge
                                if (selectedSkillSlug === 'skill_god_purge' || selectedSkillSlug === 'skill_boss_stun') {
                                    applyStun = true;
                                }
                                break;
                            }
                            case 'heal': {
                                const healAmount = skillDef.value;
                                const oldHp = enemy.hp;
                                const newEnemyHp = Math.min(enemy.maxHp, oldHp + healAmount);
                                const actualHeal = newEnemyHp - oldHp;
                                // Update in the tracked enemies array
                                updatedEnemies = updatedEnemies.map(e =>
                                    e.id === enemy.id ? { ...e, hp: newEnemyHp } : e
                                );
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！ HP ${actualHeal} 回復！`);
                                continue; // Heal does not deal damage; skip to next enemy
                            }
                            case 'drain_vit': {
                                const atkDownMod = getAtkDownMod(enemyStatusEffects);
                                enemyAtk = Math.floor(baseAtk * skillDef.value * atkDownMod);
                                isDrainVit = true;
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                                break;
                            }
                            case 'status_effect': {
                                // Currently status_effect = stun
                                applyStun = true;
                                enemyAtk = Math.floor(baseAtk * 0.5); // Light damage with status
                                newMessages.push(`${enemy.name}の『${skillDef.name}』！`);
                                break;
                            }
                        }
                    } else {
                        // Fallback: no action_pattern or no valid actions → basic attack
                        // v3.0: atk_down → 敵ATK × 0.7
                        const atkDownMod = getAtkDownMod(enemyStatusEffects);
                        enemyAtk = Math.floor(((enemy.level || 1) * 5 + 10) * atkDownMod);
                        newMessages.push(`${enemy.name}の攻撃！`);
                    }

                    // ─── v3.0: blind ミス判定 ────────────────────────
                    const missChance = getMissChance(enemyStatusEffects);
                    if (missChance > 0 && Math.random() < missChance) {
                        newMessages.push(`${enemy.name}の攻撃は目が見えず外れた！ (${Math.floor(missChance * 100)}%ミス)`);
                        continue;
                    }

                    // ─── Damage Application ─────────────────────────
                    if (enemyAtk <= 0) continue; // heal/no-damage actions already handled

                    // ─── v3.0: evasion_up 回避判定 ──────────────────
                    const playerEffectsNow = get().battleState.player_effects as StatusEffect[];
                    const evasionChance = getEvasionChance(playerEffectsNow);
                    if (evasionChance > 0 && Math.random() < evasionChance) {
                        newMessages.push(`${enemy.name}の攻撃を華麗に回避した！ (evasion_up)`);
                        continue;
                    }

                    // 1. Route Damage
                    const result = routeDamage(newParty, enemyAtk);

                    // 2. Apply Damage
                    if (result.target === 'PartyMember' && result.targetId) {
                        let damagedMemberId = result.targetId;
                        let damagedMemberNewDur = 0;
                        newParty = newParty.map(p => {
                            if (p.id === result.targetId) {
                                const def = p.def || 0;
                                const mitigated = Math.max(1, result.damage - def);
                                const newDur = Math.max(0, p.durability - mitigated);
                                damagedMemberNewDur = newDur;
                                if (result.isCovered) newMessages.push(`${p.name}がかばった！ ${mitigated}のダメージ`);
                                else newMessages.push(`${p.name}に${mitigated}のダメージ`);
                                // v3.3: パーティHPバー同期マーカー
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
                        // v24: getEffectiveDef() で実効DEFを取得（equipBonus + resonanceActive 込み）
                        const def = getEffectiveDef(newUserProfile, get().battleState);
                        // v3.0: def_up.value（固定DEF加算値）をダメージ軽減に適用
                        const currentPlayerEffects = get().battleState.player_effects as StatusEffect[];
                        const defBonus = getDefBonus(currentPlayerEffects);
                        const mitigated = Math.max(1, result.damage - def - defBonus);

                        if (newUserProfile) {
                            const prevHp = newUserProfile.hp || 0;
                            const newHp = Math.max(0, prevHp - mitigated);
                            // v3.2: ログには実際の軽減後ダメージ（mitigated）を表示（HPクランプ前の正確な値）
                            const actualDamage = prevHp - newHp; // HPへの実際の影響（内部処理用）
                            newUserProfile.hp = newHp;

                            // v3.3: ダメージごとに即座にHPバーを更新（ログ反映タイミングと同期）
                            set(state => ({
                                userProfile: state.userProfile ? { ...state.userProfile, hp: newHp } : null
                            }));

                            if (mitigated > 0) {
                                const defDesc = (def > 0 || defBonus > 0) ? ` (DEF -${def}${defBonus > 0 ? ` 防御強化 -${defBonus}` : ''})` : '';
                                newMessages.push(`あなたに ${mitigated} のダメージ${defDesc}`);
                                // v3.3: HPバー同期マーカー（タイプライターが検出してHPバーを段階更新）
                                newMessages.push(`__hp_sync:${newHp}`);
                            } else {
                                newMessages.push(`あなたに攻撃！ しかしもう意識がない…`);
                            }

                            // v20: drain_vit — スキル経由での正確な判定（旧traits依存を廃止）
                            if (isDrainVit && actualDamage > 0 && newHp > 0 && !vitDamageTaken) {
                                const currentVit = newUserProfile.vitality ?? 100;
                                if (currentVit > 0) {
                                    newUserProfile.vitality = currentVit - 1;
                                    vitDamageTaken = true;
                                    newMessages.push(`生命力を奪われた！ (Vitality -1)`);
                                    const { selectedProfileId } = get();
                                    fetch('/api/profile/consume-vitality', {
                                        method: 'POST',
                                        body: JSON.stringify({ amount: 1, profileId: selectedProfileId })
                                    }).catch(console.error);
                                }
                            }

                            // Application of Stun
                            if (applyStun && actualDamage > 0) {
                                const playerEffects = battleState.player_effects as StatusEffect[] || [];
                                const hasStunImmunity = playerEffects.some(e => e.id === 'stun_immune' && e.duration > 0);
                                if (hasStunImmunity) {
                                    newMessages.push(`強靭な意志で気絶現象を弾き返した！`);
                                } else {
                                    newMessages.push(`凄まじい衝撃で気絶した！`);
                                    set((state) => {
                                        let currentEffects = [...(state.battleState.player_effects as StatusEffect[] || [])];
                                        currentEffects = applyEffect(currentEffects, 'stun', 1);
                                        currentEffects = applyEffect(currentEffects, 'stun_immune', 2);
                                        return { battleState: { ...state.battleState, player_effects: currentEffects } };
                                    });
                                }
                            }

                            // HP0なら残りの敵の攻撃をスキップ
                            if (newHp <= 0) break;
                        }
                    }
                }

                if (newUserProfile && (newUserProfile.hp ?? 0) <= 0) {
                    newMessages.push("あなたは力尽きた...");

                    // v20: Bounty敗北ペナルティ（URLパラメータ非依存）
                    const hasBountyEnemy = activeEnemies.some(e => e.spawn_type === 'bounty');
                    if (hasBountyEnemy && newUserProfile) {
                        const currentGold = newUserProfile.gold || 0;
                        const penalty = Math.ceil(currentGold / 2);
                        if (penalty > 0) {
                            newMessages.push(`賞金稼ぎに身包みを剥がされた… 所持金の半分（${penalty}G）を失った！`);
                            // spendGold は set 後に呼ぶ
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
                    // v8.2: isDefeat時もuserProfileのHPを同期してHPバーに反映
                    set(state => ({ 
                        userProfile: newUserProfile,
                        battleState: { ...state.battleState, isDefeat: true, messages: newMessages } 
                    }));
                } else {
                    // エネミーターン完了 → ターン番号を +1 して次のターン開始
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
                        }
                    }));

                    // 次ターンの手札を配布
                    get().dealHand();
                }
            },





            setTarget: (enemyId: string) => {
                const { battleState } = get();
                const target = battleState.enemies.find(e => e.id === enemyId);
                if (target) {
                    set(state => ({
                        battleState: { ...state.battleState, enemy: target }
                    }));
                }
            },

            setTactic: (tactic: 'Aggressive' | 'Defensive' | 'Standby') => {
                set((state) => ({
                    battleState: { ...state.battleState, currentTactic: tactic }
                }));
            },

            fleeBattle: () => {
                const success = Math.random() < 0.5;

                if (success) {
                    set((state) => ({
                        battleState: {
                            ...state.battleState,
                            messages: [...state.battleState.messages, "一行は逃げ出した..."],
                            isDefeat: true,
                        }
                    }));
                } else {
                    set((state) => ({
                        battleState: {
                            ...state.battleState,
                            messages: [...state.battleState.messages, "逃走に失敗！ 敵の反撃を受ける！"]
                        }
                    }));
                    setTimeout(() => {
                        get().processEnemyTurn();
                    }, 500);
                }
            },

            waitTurn: async () => {
                const { battleState } = get();
                if (battleState.isVictory || battleState.isDefeat) return;

                // "様子を見る" = Skip action phase, preserve AP for next turn
                // AP is NOT consumed, and will gain +5 next turn (up to cap 10)
                const currentAp = battleState.current_ap || 0;
                const newMessages = [...battleState.messages, `様子を見ている... (残AP: ${currentAp} → 次ターンに持ち越し)`];

                set({
                    battleState: {
                        ...battleState,
                        messages: newMessages
                    }
                });

                // Trigger end of turn (Energy Phase + Enemy Turn)
                await get().endTurn();
            },

            clearStorage: () => {
                try {
                    localStorage.removeItem('game-storage');
                    console.log("Storage cleared");
                    window.location.reload();
                } catch (e) {
                    console.error("Failed to clear storage", e);
                }
            }
        }),
        {
            name: 'game-storage',
            partialize: (state) => ({
                gold: state.gold,
                inventory: state.inventory,
                battleState: state.battleState,
                deck: state.deck,
                hand: state.hand,
                discardPile: state.discardPile,
                selectedScenario: state.selectedScenario,
                userProfile: state.userProfile
            }),
            storage: createJSONStorage(() => typeof window !== 'undefined' ? window.localStorage : {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);
