// 4 Nations
export type NationId = 'Roland' | 'Markand' | 'Karyu' | 'Yato' | 'Neutral';
export type ReputationRank = 'Hero' | 'Famous' | 'Stranger' | 'Rogue' | 'Criminal';

export interface Reputation {
  id: string;
  user_id: string;
  location_id: string;
  score: number;
  rank: ReputationRank;
}

export interface Location {
  id: string;
  name: string;
  ruling_nation_id: string;
  prosperity_level: number;
  description?: string;
  x: number;
  y: number;
  type: string;
  nation_id?: string;
  connections: string[];
  world_states?: { controlling_nation: string }[];
  current_attributes?: {
    order: number;
    chaos: number;
    justice: number;
    evil: number;
  };
}

export interface UserHubState {
  user_id: string;
  is_in_hub: boolean;
  last_visit: string;
}

export type CardType = 'Skill' | 'Item' | 'Basic' | 'Personality' | 'Consumable' | 'noise'; // v2.11: noise追加

// v2.7: ターゲットタイプ定義
export type TargetType =
  | 'single_enemy'   // 敵単体（tauntの影響を受ける）
  | 'all_enemies'    // 敵全体
  | 'random_enemy'   // ランダム敵
  | 'self'           // 自分自身
  | 'single_ally'    // 味方単体
  | 'all_allies';    // 味方全体

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost: number;
  ap_cost?: number; // Added v2.3 (Battle AP)
  power?: number;
  isEquipment?: boolean;
  source?: string; // e.g. "Party:Wolf"
  effect_id?: string; // v2.5: バフ/デバフID (e.g. 'atk_up', 'poison')
  effect_duration?: number; // v2.5: 効果持続ターン数
  target_type?: TargetType; // v2.7: ターゲットタイプ
  discard_cost?: number; // v2.11: Noise廃棄コスト (AP)
  isInjected?: boolean; // v4.1: 環境カード (Cost 0扱い)
  cost_type?: 'mp' | 'vitality'; // v5.1: コストタイプ
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  def?: number; // Added v2.2
  image?: string;
  slug?: string; // v2.1
  traits?: string[]; // Added v10 for special effects like drain_vit
  drop_rate?: number; // v2.6: ドロップ率 0-100
  drop_item_slug?: string; // v2.6: ドロップアイテムslug
  status_effects?: { id: string; duration: number }[]; // v3.5: Per-enemy effects
  vit_damage?: number; // v3.5: Vit damage per attack
}

// ... (skipping unchanged interfaces) ...

export interface UserProfile {
  id: string; // uuid
  name?: string; // Actual User Name
  title_name: string; // Title/Rank
  avatar_url?: string;
  order_pts: number;
  chaos_pts: number;
  justice_pts: number;
  evil_pts: number;
  gold: number;
  updated_at: string;

  current_location_id?: string;
  current_location_name?: string; // Joined field
  locations?: Location; // Joined relation

  age?: number;
  accumulated_days?: number;
  previous_location_id?: string;
  level?: number;
  exp?: number;
  max_deck_cost?: number; // v8.0 Deck Cost System

  // Life & combat
  gender?: 'Male' | 'Female' | 'Unknown';
  vitality?: number;
  max_vitality?: number;
  max_hp?: number;
  hp?: number;
  max_mp?: number;
  mp?: number;
  attack?: number;
  atk?: number; // v8.1: 基礎攻撃力 (1-15)
  // defense?: number; // Previous placeholder?
  def?: number; // Added v2.2
  age_days?: number; // v9.3: 現年齢内の経過日数 (365でリセット)
  current_quest_id?: string; // v3.3: デッキロック用 (クエスト中はnon-null)
  current_quest_state?: any; // v3.4: Resume Persistence

  // Social
  praise_count?: number;
  prayer_count?: number;

  reputations?: Reputation[]; // Joined

  // Added for v3.0 check_status compatibility
  alignment?: {
    order: number;
    chaos: number;
    justice: number;
    evil: number;
  };
}

// ...

export interface PartyMember {
  id: string;
  owner_id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Unknown';
  origin: 'system' | 'ghost';
  origin_type?: string; // e.g. 'system_mercenary', 'shadow_heroic', 'active_shadow'
  job_class: string;

  durability: number;
  max_durability: number;
  def?: number; // Added v2.2
  cover_rate: number;
  loyalty: number;

  avatar_url?: string;
  personality?: string;

  inject_cards: string[]; // Card IDs (raw from DB)
  passive_id?: string;
  is_active: boolean;

  // v2.4 NPC AI fields
  ai_role?: 'striker' | 'guardian' | 'medic';
  ai_grade?: 'smart' | 'random';
  current_ap?: number; // Per-NPC AP in battle
  signature_deck?: Card[]; // Resolved card objects for AI use
  used_this_turn?: string[]; // Card IDs used this turn (1-per-turn limit)
  status_effects?: { id: string; duration: number }[]; // v2.5
}

export type Adventurer = PartyMember;

// --- From Database Types (Merged) ---

export interface UserProfileDB {
  id: string;
  gender: 'Male' | 'Female' | 'Unknown';
  age: number;
  vitality: number;
  max_vitality: number;
  reputation: Record<string, number>; // { loc_id: score }
  alignment: {
    order: number;
    chaos: number;
    justice: number;
    evil: number;
  };
  gold: number;
  current_location_id?: string;
  current_quest_state?: any; // v3.4 Resume Persistence
  // Battle/Growth Stats
  level: number;
  exp: number;
  hp: number;
  max_hp: number;
  attack: number;
  def: number;
  max_deck_cost: number;
  // ...
}

export interface ScenarioCondition {
  locations?: string[]; // Location IDs or Names where this occurs
  min_level?: number;
  required_tags?: string[]; // Inventory tags or skill tags
  alignment_filter?: {
    order?: number; // min req
    chaos?: number;
    justice?: number;
    evil?: number;
  };
  required_reputation?: number; // Min reputation at the location
  gender?: 'Male' | 'Female';
  min_prosperity?: number;
  max_prosperity?: number;
  event_trigger?: string;
  required_alignment?: Record<string, number>;
}

export interface ScenarioReward {
  gold?: number;
  items?: string[]; // Item IDs
  alignment_shift?: {
    order?: number;
    chaos?: number;
    justice?: number;
    evil?: number;
  };
  reputation_diff?: Record<string, number>; // { loc_id: delta }
  world_impact?: {
    target_loc: string; // loc_id
    attribute: 'order' | 'chaos' | 'justice' | 'evil';
    value: number;
  };
  move_to?: string; // Location ID to move to
  vitality_cost?: number; // Vitality cost
  npc_reward?: number; // NPC ID
}

export interface ScenarioChoice {
  label: string;
  req_tag?: string; // e.g. "skill_picklock"
  cost_vitality?: number;
  next_node: string; // ID of the next node
  req?: { type: string; val: any }; // For v3 checks
  cost?: { type: string; val: any }; // For v3 costs
}

export interface ScenarioFlowNode {
  id: string;
  text: string;
  choices: ScenarioChoice[];
  // Loose typing for Scenario Engine flexibility
  type?: string;
  bg_key?: string;
  bgm_key?: string;
  enemy_group_id?: string;
  params?: any;
  [key: string]: any;
}

export interface ScenarioDB {
  id: number; // Changed to number (BIGINT)
  slug: string; // Added
  title: string;
  description: string; // Initial summary
  client_name: string;
  type: 'Subjugation' | 'Delivery' | 'Politics' | 'Dungeon' | 'Other';
  difficulty: number; // Added
  rec_level: number; // Added for UI
  is_urgent: boolean; // Added for UI
  trigger_condition?: string; // Added for v3 API
  time_cost: number;
  ruling_nation_id?: string | null;
  location_id?: string | null;

  // JSONB columns
  conditions: ScenarioCondition;
  rewards: ScenarioReward;
  flow_nodes: ScenarioFlowNode[];
  script_data?: any; // BYORK Script JSON
  impact?: {
    target_loc?: string;
    attribute?: string;
    value?: number;
  };
  days_success?: number;
  days_failure?: number;

  // Spec v3.1 Fields
  quest_type?: 'normal' | 'special';
  requirements?: Record<string, any>;
  location_tags?: string[];

  // UI Helpers (Optional/Mapped)
  reward_gold?: number;
  impacts?: any;

  created_at?: string;
}

export interface LocationDB {
  id: string;
  name: string;
  description?: string; // Added (was missing in interface but used in code?)

  // v4.2 Topology & Prosperity
  ruling_nation_id: string;
  prosperity_level: 1 | 2 | 3 | 4 | 5;
  current_attributes: {
    order: number;
    chaos: number;
    justice: number;
    evil: number;
  };

  map_x?: number;
  map_y?: number;
  neighbors?: Record<string, { days: number; type?: string }>; // { 'loc_b': { days: 1, type: 'road' } }
}

export interface WorldState {
  id?: string;
  location_name: string;
  order_score: number;
  chaos_score: number;
  justice_score: number;
  evil_score: number;
  status: string;
  attribute_name: string;
  controlling_nation: string;
  prosperity_level: number;
  last_friction_score?: number;
  updated_at?: string;
  total_days_passed?: number; // Added for Almanac
  background_url?: string; // Optional UI helper
  flavor_text?: string;    // Optional UI helper
}

export interface WorldHistory {
  id: number;
  location_name: string;
  headline: string;
  news_content: string;
  old_status: string;
  new_status: string;
  old_attribute: string;
  new_attribute: string;
  occured_at: string;
}

export interface PartyMemberDB {
  id: number; // Changed to number (BIGINT)
  owner_id: string | null; // UUID or null for pool
  slug: string; // Master template slug
  name: string;
  gender: 'Male' | 'Female' | 'Unknown';
  origin: 'system' | 'ghost' | 'shadow_active';
  job_class: string;
  durability: number;
  max_durability: number;
  loyalty: number;
  cover_rate: number;
  inject_cards: number[]; // Array of Card IDs
  is_active: boolean;
  quest_req_id?: string; // v3.4 Guest Context
  created_at?: string;
}

export interface ItemDB {
  id: number; // Changed to number (BIGINT)
  slug: string;
  name: string;
  type: 'consumable' | 'skill' | 'equipment';
  base_price: number;
  effect_data: any;

  // Availability
  quest_req_id?: string; // v6.1 Quest Context
  nation_tags: string[];
  min_prosperity: number;
  required_alignment: {
    order?: number;
    chaos?: number;
    justice?: number;
    evil?: number;
  };
  linked_card_id?: number; // FK to Cards
  is_black_market: boolean;
  created_at?: string;
}

export interface CardDB {
  id: number;
  slug: string;
  name: string;
  type: string;
  cost_type: 'vitality' | 'mp';
  cost_val: number;
  effect_val: number;
  created_at?: string;
}

export interface BattleState {
  enemy: Enemy | null; // Current Target
  enemies: Enemy[]; // v3.5: All Enemies
  party: PartyMember[];
  messages: string[];
  turn: number;
  current_ap: number; // Added v2.3 (Max: 10, Initial: 5)
  isVictory: boolean;
  isDefeat: boolean;
  currentTactic: 'Aggressive' | 'Defensive' | 'Standby';
  // v2.5 Status Effects
  player_effects: { id: string; duration: number }[];
  enemy_effects: { id: string; duration: number }[];
  // v2.6 Deck Cycle
  exhaustPile: { id: string; name: string; type: string }[]; // Consumable使用済み
  consumedItems: string[]; // 戦闘後インベントリ同期用 inventory_id[]
  // v2.11 Final
  vitDamageTakenThisTurn?: boolean; // drain_vit 1ターン1回制限
  battle_result?: 'victory' | 'defeat' | 'time_over' | 'flee'; // 戦闘結果
}

export type Scenario = ScenarioDB;

export interface InventoryItem extends ItemDB {
  quantity: number;
  is_equipped: boolean;
  is_skill: boolean;
  cost?: number; // Derived from linked card or item data
}
