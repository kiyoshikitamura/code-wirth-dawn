// 4 Nations
export type NationId = 'Roland' | 'Markand' | 'Karyu' | 'Yato' | 'Neutral';
export type ReputationRank = 'Hero' | 'Famous' | 'Stranger' | 'Rogue' | 'Criminal';

export type CardType = 'Skill' | 'Item' | 'Basic' | 'Personality' | 'Consumable';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  description: string;
  cost: number;
  power?: number;
  isEquipment?: boolean;
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
// ...
export interface BattleState {
  enemy: Enemy | null;
  party: Adventurer[];
  turn: number;
  messages: string[];
  isVictory: boolean;
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
