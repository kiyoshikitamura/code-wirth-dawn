import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin, hasServiceKey } from '@/lib/supabase-admin';
import { WORLD_ID } from '@/utils/constants';
import { UI_RULES } from '@/constants/game_rules';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Use Admin client if available
        let client = hasServiceKey && supabaseAdmin ? supabaseAdmin : supabase;

        // If no Admin Key, try to use User Token specifically for Profile Reset
        const authHeader = req.headers.get('authorization');
        if (!hasServiceKey && authHeader) {
            const token = authHeader.replace('Bearer ', '');
            // Re-create client with user token to bypass RLS for *that user*
            // We import createClient specifically to avoid singleton issues if needed, 
            // but here we can just assume 'supabase' + auth header works if we use the helper logic
            // faster: just use the token in a new client instance
            const { createClient } = require('@supabase/supabase-js'); // dynamic import or use existing import
            client = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
                process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key',
                { global: { headers: { Authorization: authHeader } } }
            );
            console.log("Using User-Scoped Client for Reset (Admin Key missing)");
        }

        if (!hasServiceKey) {
            console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY missing. Reset may be incomplete due to RLS.");
        }

        // 1. Reset World State
        const defaultState = {
            order_score: 10,
            chaos_score: 10,
            justice_score: 10,
            evil_score: 10,
            status: '繁栄',
            attribute_name: '至高の平穏',
            flavor_text: '秩序と正義が保たれ、人々は安らかに暮らしている。',
            background_url: '/backgrounds/peace.jpg'
        };

        const { data: worldData, error: worldError } = await client
            .from('world_states')
            .update(defaultState)
            .eq('location_name', '国境の町')
            .select('*');

        if (worldError) console.error("World reset error:", worldError);
        const worldUpdatedCount = worldData?.length || 0;
        console.log("World reset count:", worldUpdatedCount);

        // If no world state found to update, insert one
        if (worldUpdatedCount === 0) {
            console.log("No World State found. Inserting default...");
            const { error: insertError } = await client
                .from('world_states')
                .insert([{ location_name: '国境の町', ...defaultState }]);
            if (insertError) console.error("World insert failed:", insertError);
        }

        // 2. 全ユーザーデータの削除
        // 2a. インベントリ削除
        const { error: invError } = await client
            .from('inventory')
            .delete()
            .not('id', 'is', null);
        if (invError) console.error("インベントリ削除エラー:", invError);

        // 2b. 名声データ削除
        const { error: repError } = await client
            .from('reputations')
            .delete()
            .not('id', 'is', null);
        if (repError) console.error("名声削除エラー:", repError);

        // 2c. クエスト進捗削除
        const { error: questProgError } = await client
            .from('quest_progress')
            .delete()
            .not('id', 'is', null);
        if (questProgError) console.error("クエスト進捗削除エラー:", questProgError);

        // 2d. 世界履歴削除
        const { error: worldHistError } = await client
            .from('world_history')
            .delete()
            .not('id', 'is', null);
        if (worldHistError) console.error("世界履歴削除エラー:", worldHistError);

        // 2e. 世界状態履歴削除
        const { error: stateHistError } = await client
            .from('world_states_history')
            .delete()
            .not('id', 'is', null);
        if (stateHistError) console.error("世界状態履歴削除エラー:", stateHistError);

        // 2f. パーティメンバーリセット
        const { error: pmError } = await client
            .from('party_members')
            .update({ owner_id: null, is_active: false })
            .not('owner_id', 'is', null);
        if (pmError) console.error("パーティリセットエラー:", pmError);

        // 2g. 装備データ削除
        const { error: equipError } = await client
            .from('equipped_items')
            .delete()
            .not('id', 'is', null);
        if (equipError) console.error("装備データ削除エラー:", equipError);

        // 2h. スキルデータ削除
        const { error: skillError } = await client
            .from('user_skills')
            .delete()
            .not('id', 'is', null);
        if (skillError) console.error("スキルデータ削除エラー:", skillError);

        // 2a. Get Start Location ID (国境の町 = 正規の初期拠点)
        let { data: startLoc } = await client
            .from('locations')
            .select('id')
            .eq('slug', 'loc_border_town')
            .maybeSingle();

        if (!startLoc) {
            // slug で見つからない場合は name でフォールバック
            const { data: fallbackLoc } = await client
                .from('locations')
                .select('id')
                .eq('name', '国境の町')
                .maybeSingle();
            startLoc = fallbackLoc;
        }

        if (!startLoc) {
            console.log("Start location '国境の町' not found. Creating fallback...");
            const { data: newLoc } = await client
                .from('locations')
                .insert([{
                    name: '国境の町',
                    slug: 'loc_border_town',
                    type: 'Town',
                    description: '四つの国の境界に位置する交易の町。',
                    x: 50,
                    y: 50,
                    nation_id: 'Neutral',
                    connections: []
                }])
                .select('id')
                .single();
            startLoc = newLoc;
        }

        const startLocId = startLoc?.id || '00000000-0000-0000-0000-000000000000'; // Fallback UUID if creation failed (should fail constraint if strictly FK)

        // 3. Reset User Profile
        // Reset ALL profiles including Demo
        const { data: profileData, error: profileError } = await client
            .from('user_profiles')
            .update({
                order_pts: 0,
                chaos_pts: 0,
                justice_pts: 0,
                evil_pts: 0,
                title_name: '名もなき旅人',
                avatar_url: UI_RULES.DEFAULT_AVATAR,
                current_location_id: startLocId, // Reset location
                previous_location_id: null, // Reset previous location
                accumulated_days: 0,
                gender: 'Unknown',

                // Add Level Reset (User Request)
                level: 1,
                exp: 0,
                gold: 1000,
                vitality: 100,
                max_vitality: 100,
                is_alive: true,

                // Fix: Reset Battle Stats (Regression Fix)
                hp: 100,
                max_hp: 100,
                atk: 5, // Default base atk
                def: 0,

                // Fix: Reset Character Creation (Regression Fix)
                age: null as any, // Should trigger character creation
                name: null as any, // Clear user name

                // Fix: Reset Quest State
                current_quest_id: null,
                current_quest_state: null
            })
            // .neq removed to ensure Demo Profile is reset
            .not('id', 'is', null) // Safety clause
            .select('*');

        if (profileError) console.error("Profile reset error:", profileError);
        const profileUpdatedCount = profileData?.length || 0;
        console.log("Profile reset count:", profileUpdatedCount);

        // Explicit check for single user update if using User Client
        if (profileUpdatedCount === 0 && !hasServiceKey && authHeader) {
            // Maybe RLS prevented "update all", try updating checking ID explicitly?
            console.warn("User-Scoped Reset returned 0 rows. Check RLS or Token.");
        }

        // Fallback: If no profiles updated, ensure Demo Profile exists
        if (profileUpdatedCount === 0) {
            console.log("No Profiles updated. Inserting demo profile...");
            const { error: insertProfileError } = await client
                .from('user_profiles')
                .upsert([{
                    id: '00000000-0000-0000-0000-000000000000',
                    title_name: '名もなき旅人',
                    avatar_url: UI_RULES.DEFAULT_AVATAR,
                    order_pts: 0, chaos_pts: 0, justice_pts: 0, evil_pts: 0, gold: 1000
                }]);
            if (insertProfileError) console.error("Profile insert failed:", insertProfileError);
        }
        // 4. Reset Hub States (国境の町は通常拠点なので is_in_hub = false)
        const { error: hubError } = await client
            .from('user_hub_states')
            .update({ is_in_hub: false })
            .not('user_id', 'is', null);

        // 国境の町はハブではないため、is_in_hub を false に設定
        // ハブに戻ったときに move API で true に再設定される

        if (hubError) console.error("Hub State reset error:", hubError);

        if (profileUpdatedCount === 0 && !hasServiceKey) {
            throw new Error("Reset failed: No profiles updated. Missing Admin Key (SUPABASE_SERVICE_ROLE_KEY)?");
        }

        return NextResponse.json({
            success: true,
            message: "World, Inventory, and Profiles Reset",
            debug: {
                worldUpdated: worldUpdatedCount,
                profileUpdated: profileUpdatedCount
            }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
