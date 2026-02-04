// 4 Nations
export type NationId = 'Roland' | 'Markand' | 'Karyu' | 'Yato' | 'Neutral';
export type ReputationRank = 'Hero' | 'Famous' | 'Stranger' | 'Rogue' | 'Criminal';

export interface UserHubState {
  user_id: string;
  is_in_hub: boolean;
  last_visit: string;
}

export type CardType = 'Skill' | 'Item' | 'Basic' | 'Personality' | 'Consumable';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost: number;
  power?: number;
  isEquipment?: boolean;
  source?: string; // e.g. "Party:Wolf"
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  image?: string;
}

export interface Coupon {
  id: string;
  name: string;
  effect: string;
  value: number;
}

export interface Adventurer {
  id: string;
  name: string;
  age: number;
  class: string;
  coupons: Coupon[];
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  image?: string;
  attack?: number; // Base attack power
}
export interface WorldState {
  id: string; // uuid
  location_name: string;
  status: 'Zenith' | 'Prosperous' | 'Stagnant' | 'Declining' | 'Ruined' | '繁栄' | '衰退' | '崩壊' | '混乱' | string;
  attribute_name: string; // '至高の平穏' etc.
  flavor_text: string;
  background_url?: string;

  // V4 Mechanics
  prosperity_level?: number;
  last_friction_score?: number;

  // Scores
  order_score: number;
  chaos_score: number;
  justice_score: number;
  evil_score: number;

  // Territory
  controlling_nation: NationId;

  updated_at?: string;
  total_days_passed?: number;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  type: string;
  connections: string[]; // JSON array of names
  nation_id: NationId; // Static Region
  world_states?: WorldState[]; // Joined data
}

export interface WorldHistory {
  id: string; // uuid
  location_name: string;
  headline: string;
  news_content?: string;
  old_status: string; // or null
  new_status: string;
  old_attribute: string; // or null
  new_attribute: string;
  occured_at: string;
}

export interface Reputation {
  location_name: string;
  score: number;
  rank: ReputationRank;
}

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

  // Life & combat
  gender?: 'Male' | 'Female' | 'Unknown';
  vitality?: number;
  max_vitality?: number;
  max_hp?: number;
  hp?: number;
  max_mp?: number;
  mp?: number;
  attack?: number;
  defense?: number;

  // Social
  praise_count?: number;
  prayer_count?: number;

  reputations?: Reputation[]; // Joined
}
export interface BattleState {
  enemy: Enemy | null;
  party: PartyMember[];
  turn: number;
  messages: string[];
  isVictory: boolean;
  isDefeat?: boolean;
  cooldowns?: { [cardId: string]: number };
  currentTactic?: 'Aggressive' | 'Defensive' | 'Standby';
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  location_name?: string;

  client_name: string;
  client_nation?: NationId;

  required_status?: string;
  // required_attribute?: string; // Simplified out for now or keep? Keep for compatibility if needed but usually separate logic

  reward_gold: number;

  // Impacts
  impacts?: {
    order: number;
    chaos: number;
    justice: number;
    evil: number;
  };
  rep_impact?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  item_type: 'skill' | 'item' | 'weapon';
  required_attribute: string; // 'ANY' or specific
  power_value?: number;
  stock_limit?: number;
}

export interface InventoryItem {
  id: string; // inventory.id
  item_id: string;
  name: string;
  description: string;
  item_type: 'skill' | 'item' | 'consumable' | 'weapon';
  power_value: number;
  required_attribute: string;
  is_equipped: boolean;
  acquired_at: string;
  quantity: number;
  is_skill: boolean;
}

export interface PartyMember {
  id: string;
  owner_id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Unknown';
  origin: 'system' | 'ghost';
  job_class: string;

  durability: number;
  max_durability: number;
  cover_rate: number;
  loyalty: number;

  avatar_url?: string;
  personality?: string;

  inject_cards: string[]; // Card IDs
  passive_id?: string;
  is_active: boolean;
}
