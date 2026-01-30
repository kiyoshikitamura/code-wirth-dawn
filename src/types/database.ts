
export interface UserProfileDB {
    id: string;
    gender: 'Male' | 'Female' | 'Unknown';
    age: number;
    vitality: number;
    max_vitality: number;
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
