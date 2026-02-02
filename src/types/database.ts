
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
    // ... other fields implicitly
}

export interface PartyMemberDB {
    id: string;
    owner_id: string;
    name: string;
    gender: 'Male' | 'Female' | 'Unknown';
    origin: 'system' | 'ghost';
    job_class: string;
    durability: number;
    max_durability: number;
    loyalty: number;
    cover_rate: number;
    inject_cards: string[];
    is_active: boolean;
    created_at?: string;
}

// --- Quest System v3 Types ---

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
}

export interface ScenarioChoice {
    label: string;
    req_tag?: string; // e.g. "skill_picklock"
    cost_vitality?: number;
    next_node: string; // ID of the next node
}

export interface ScenarioFlowNode {
    id: string;
    text: string;
    choices: ScenarioChoice[];
}

export interface ScenarioDB {
    id: string;
    title: string;
    description: string; // Initial summary
    client_name: string;
    type: 'Subjugation' | 'Delivery' | 'Politics' | 'Dungeon' | 'Other';
    time_cost: number;
    ruling_nation_id?: string | null;
    location_id?: string | null;

    // JSONB columns
    conditions: ScenarioCondition;
    rewards: ScenarioReward;
    flow_nodes: ScenarioFlowNode[];

    created_at?: string;
}

export interface LocationDB {
    id: string;
    name: string;
    ruling_nation_id: string;
    prosperity_level: 1 | 2 | 3 | 4 | 5;
    current_attributes: {
        order: number;
        chaos: number;
        justice: number;
        evil: number;
    };
    // ...
}
