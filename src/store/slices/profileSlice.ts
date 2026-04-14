import { supabase } from '@/lib/supabase';
import type { GameState } from '../types';

// ─── ヘルパー関数 (shared) ────────────────────────────────────────────────────
export function getEffectiveAtk(
    up: { atk?: number } | null,
    bs: { equipBonus?: { atk: number; def: number; hp: number }; resonanceActive?: boolean }
): number {
    return Math.floor(((up?.atk || 0) + (bs.equipBonus?.atk || 0)) * (bs.resonanceActive ? 1.1 : 1.0));
}

export function getEffectiveDef(
    up: { def?: number } | null,
    bs: { equipBonus?: { atk: number; def: number; hp: number }; resonanceActive?: boolean }
): number {
    return Math.floor(((up?.def || 0) + (bs.equipBonus?.def || 0)) * (bs.resonanceActive ? 1.1 : 1.0));
}

export function getEffectiveMaxHp(
    up: { max_hp?: number } | null,
    bs: { equipBonus?: { atk: number; def: number; hp: number } }
): number {
    return (up?.max_hp || 100) + (bs.equipBonus?.hp || 0);
}
// ──────────────────────────────────────────────────────────────────────────────

export type ProfileSliceActions = Pick<
    GameState,
    | 'fetchUserProfile'
    | 'fetchWorldState'
    | 'fetchHubState'
    | 'fetchEquipment'
    | 'addGold'
    | 'spendGold'
    | 'setSelectedProfileId'
    | 'setHasHydrated'
    | 'setShowStatus'
    | 'clearStorage'
>;

export const createProfileSlice = (
    set: (partial: Partial<GameState> | ((state: GameState) => Partial<GameState>)) => void,
    get: () => GameState
): ProfileSliceActions => ({

    setSelectedProfileId: (id) => set({ selectedProfileId: id }),

    setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

    setShowStatus: (show) => set({ showStatus: show }),

    clearStorage: () => {
        try {
            localStorage.removeItem('game-storage');
            console.log('Storage cleared');
            window.location.reload();
        } catch (e) {
            console.error('Failed to clear storage', e);
        }
    },

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
                set({ userProfile: profile, gold: profile.gold });

                // v13.1: 装備ボーナスをプロフィール取得後に自動初期化
                get().fetchEquipment().catch(e =>
                    console.warn('[fetchUserProfile] fetchEquipment 自動呼び出し失敗（無害）', e)
                );
            }
        } catch (e) {
            console.error('Failed to fetch profile', e);
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
                set({ hubState: data });
            } else if (!error) {
                const { data: newData, error: insertError } = await supabase
                    .from('user_hub_states')
                    .insert([{ user_id: userProfile.id, is_in_hub: false }])
                    .select()
                    .single();

                if (newData) set({ hubState: newData });
                else console.warn('Failed to init hub state', insertError);
            }
        } catch (e) {
            console.error('Failed to fetch hub state', e);
        }
    },

    fetchWorldState: async () => {
        try {
            await get().fetchHubState();
            const { userProfile, hubState } = get();

            let targetLocationName = '国境の町';

            if (hubState?.is_in_hub) {
                targetLocationName = '名もなき旅人の拠所';
            } else if (userProfile?.current_location_id) {
                if (userProfile.locations?.name) {
                    targetLocationName = userProfile.locations.name;
                } else {
                    const locId = userProfile.current_location_id;
                    const { data: locData } = await supabase
                        .from('locations')
                        .select('name')
                        .or(`id.eq.${locId},slug.eq.${locId}`)
                        .maybeSingle();
                    if (locData?.name) targetLocationName = locData.name;
                }
            } else if (userProfile?.locations?.name) {
                targetLocationName = userProfile.locations.name;
            }

            console.log('Fetching World State for:', targetLocationName);

            const { data, error } = await supabase
                .from('world_states')
                .select('*')
                .eq('location_name', targetLocationName)
                .maybeSingle();

            let hegemonyData: any[] = [];
            try {
                const hegemonyRes = await fetch('/api/world/hegemony', { cache: 'no-store' });
                if (hegemonyRes.ok) {
                    const hData = await hegemonyRes.json();
                    hegemonyData = hData.hegemony || [];
                }
            } catch (e) { console.error('Hegemony fetch error', e); }

            if (data && !error) {
                set({ worldState: { ...(data as any), hegemony: hegemonyData } });
            } else {
                console.warn(`fetchWorldState failed for ${targetLocationName}, attempting auto-initialization...`);
                try {
                    const initRes = await fetch('/api/admin/update-world', {
                        method: 'POST',
                        headers: { 'Cache-Control': 'no-cache' },
                        body: JSON.stringify({ location_name: targetLocationName }),
                        cache: 'no-store'
                    });
                    if (initRes.ok) {
                        const { data: newData } = await supabase
                            .from('world_states')
                            .select('*')
                            .eq('location_name', targetLocationName)
                            .maybeSingle();
                        if (newData) {
                            set({ worldState: { ...(newData as any), hegemony: hegemonyData } });
                            return;
                        }
                    }
                } catch (initErr) {
                    console.error('Auto-initialization API call failed', initErr);
                }

                const dummyState: any = {
                    location_name: targetLocationName,
                    status: '繁栄',
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
            console.error('Failed to fetch world state', e);
        }
    },

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
});
