
export interface Alignment {
    order: number;
    chaos: number;
    justice: number;
    evil: number;
}

export interface UserProfile {
    id: string;
    // ... existing fields ...
    // We only define the fields relevant to the DB schema here, 
    // but typically this interface mirrors the full DB row + some joins.
    // For now, let's just add the life cycle fields.
    gender?: 'Male' | 'Female' | 'Unknown';
    age: number;
    vitality: number;
    max_vitality: number;
    // ... other fields from previous definitions ...
    // Note: In a real 'types/database.ts', we often put the EXACT row shape.
    // Since we are creating this file new, we define the exact LifeCycle shapes.
}

export interface PartyMember {
    id: string;
    owner_id: string;
    name: string;
    gender: 'Male' | 'Female' | 'Unknown';
    origin: 'system' | 'ghost';
    nation_id: string;
    alignment: Alignment;
    loyalty: number;
    contract_cost: number;
    condition: 'healthy' | 'injured' | 'fear';
    durability: number; // HP
    inject_cards: string[]; // Card IDs
    passive_skill?: string;
    created_at?: string;
    updated_at?: string;
}
