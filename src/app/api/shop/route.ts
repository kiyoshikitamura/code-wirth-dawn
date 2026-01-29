import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { WORLD_ID } from '@/utils/constants';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    type: 'Item' | 'Skill' | 'Equipment'; // Simplified for now
    required_attribute?: string | 'ANY'; // 'Order', 'Chaos', etc.
}

export async function GET(req: Request) {
    try {
        // 1. Fetch User Profile to get Current Location
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('*, locations(*)')
            .limit(1);

        const profile = profiles?.[0];
        const currentLocationName = profile?.locations?.name || '名もなき旅人の拠所';

        // 2. Get current world state
        const { data: worldState } = await supabase
            .from('world_states')
            .select('status, attribute_name')
            .eq('location_name', currentLocationName)
            .maybeSingle();

        const currentAttribute = worldState?.attribute_name || '不明';
        const status = worldState?.status || '安定';

        // 2. Fetch Items from DB
        const { data: dbItems, error: itemsError } = await supabase
            .from('items')
            .select('*');

        if (itemsError) throw itemsError;

        // 3. Filter items
        const availableItems = (dbItems || []).filter((item: any) => {
            return item.required_attribute === 'ANY' || item.required_attribute === currentAttribute;
        });

        // Debug Log
        console.log(`[API/Shop] Current Attribute: ${currentAttribute}`);
        console.log(`[API/Shop] Items Fount: ${availableItems.length}`);

        // Price scaling & Stock Logic
        let priceMultiplier = 1.0;
        let stockMultiplier = 1.0;

        switch (status) {
            case 'Zenith':
                priceMultiplier = 0.8;
                stockMultiplier = 1.2;
                break;
            case 'Prosperous':
            case '繁栄': // Fallback
                priceMultiplier = 1.0;
                stockMultiplier = 1.0;
                break;
            case 'Stagnant':
                priceMultiplier = 1.2;
                stockMultiplier = 0.8;
                break;
            case 'Declining':
            case '衰退': // Fallback
                priceMultiplier = 1.5;
                stockMultiplier = 0.5;
                break;
            case 'Ruined':
            case '崩壊': // Fallback
                priceMultiplier = 2.0;
                stockMultiplier = 0.2;
                break;
            default:
                priceMultiplier = 1.0;
        }

        const finalItems = availableItems.map((item: any) => {
            const adjustedstock = item.stock_limit ? Math.ceil(item.stock_limit * stockMultiplier) : null;
            return {
                id: item.id,
                name: item.name,
                description: item.description,
                price: Math.ceil(item.price * priceMultiplier),
                item_type: item.item_type,
                required_attribute: item.required_attribute,
                power_value: item.power_value,
                stock_limit: adjustedstock
            };
        });

        return NextResponse.json({ items: finalItems, multiplier: priceMultiplier });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
