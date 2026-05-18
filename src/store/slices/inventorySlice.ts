import { supabase } from '@/lib/supabase';
import type { GameState } from '../types';

export type InventorySliceActions = Pick<
    GameState,
    'fetchInventory' | 'toggleEquip'
>;

export const createInventorySlice = (
    set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
    get: () => GameState
): InventorySliceActions => ({

    fetchInventory: async () => {
        try {
            const { userProfile } = get();
            const { data: { session } } = await supabase.auth.getSession();
            // [Security] JWT認証のみ — x-user-id廃止 (v27.2)
            const headers: HeadersInit = {};
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

            const res = await fetch('/api/inventory', { headers, cache: 'no-store' });
            if (res.ok) {
                const { inventory } = await res.json();
                set({ inventory });
            }
        } catch (e) {
            console.error('Failed to fetch inventory', e);
        }
    },

    toggleEquip: async (itemId: string, currentEquip: boolean, bypassLock?: boolean) => {
        try {
            const { inventory } = get();
            const targetItem = inventory.find(i => String(i.id) === itemId);
            const newInventory = inventory.map(i =>
                String(i.id) === itemId ? { ...i, is_equipped: !currentEquip } : i
            );
            set({ inventory: newInventory });

            const { userProfile } = get();
            const { data: { session } } = await supabase.auth.getSession();
            // [Security] JWT認証のみ — x-user-id廃止 (v27.2)
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

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
            console.error('Failed to toggle equip', e);
        }
    },
});
