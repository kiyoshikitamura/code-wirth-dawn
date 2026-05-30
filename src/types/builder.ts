// UGC Quest Builder Types
// Phase 1: Visual flow editor type definitions

// Canvas state for the visual flow editor
export interface CanvasState {
  nodes: BuilderNode[];
  edges: BuilderEdge[];
  viewport: { x: number; y: number; zoom: number };
  selectedNodeId: string | null;
  draggingNodeId: string | null;
  connectingFromId: string | null;
}

export interface BuilderNode {
  id: string;
  type: BuilderNodeType;
  position: { x: number; y: number };
  data: BuilderNodeData;
}

export type BuilderNodeType = 'text' | 'battle' | 'delivery' | 'trap' | 'success' | 'failure';

export interface BuilderNodeData {
  // text node
  text?: string;
  speaker_name?: string;
  bg_key?: string;
  bgm_key?: string;
  choices?: { label: string; next: string }[];
  // battle node
  preset_enemy_id?: string;
  enemy_level?: number;
  // delivery node
  delivery_item_slug?: string;
  delivery_quantity?: number;
  // trap node
  damage_pct?: number;
  // end nodes
  result?: 'success' | 'failure';
}

export interface BuilderEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  handleIndex?: number; // 0=default, 1=choice B
}

export interface BuilderQuest {
  title: string;
  short_description: string;
  client_name: string;
  scenario_type: 'Subjugation' | 'Delivery' | 'Politics' | 'Dungeon' | 'Other';
  difficulty: number;
  rec_level: number;
  days_success: number;
  days_failure: number;
  conditions: {
    min_align_order_pct?: number;
    min_align_chaos_pct?: number;
    min_align_justice_pct?: number;
    min_align_evil_pct?: number;
  };
  rewards: {
    items: { slug: string; quantity: number }[];
  };
  canvas: CanvasState;
}

export interface PresetEnemy {
  id: string;
  name: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'boss';
  baseLevel: number;
  hp: number;
  atk: number;
  def: number;
  skills: string[];
  actionPattern: { skill: string; prob: number; condition?: string }[];
  description: string;
}

export interface PresetRewardItem {
  slug: string;
  name: string;
  type: 'consumable' | 'trade_good';
  effect_summary: string;
  power_cost: number;
}

export interface BuilderBgOption {
  key: string;
  label: string;
  category: string;
  icon: string;
}

export interface BuilderBgmOption {
  key: string;
  label: string;
  category: string;
  icon: string;
}
