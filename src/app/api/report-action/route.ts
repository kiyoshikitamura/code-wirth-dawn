import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuthClient } from '@/lib/supabase-auth';
import { WORLD_ID } from '@/utils/constants';
import { calculateTitle } from '@/lib/character';
import { checkAndFireTrigger, buildShareData, isTierUpgrade, getTitleTier } from '@/lib/shareUtils';
import { getFlavor } from '@/lib/shareTextLoader';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const supabaseAuth = createAuthClient(req);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, impacts, scenario_id } = await req.json();

        console.log(`Action reported: ${action} `, impacts);

        // 1. Insert Action Log (Table removed in latest SQL)
        // const { error: logError } = await supabase
        //     .from('action_logs')
        //     .insert([{
        //         action_type: action,
        //         location_name: '国境の町',
        //         created_at: new Date().toISOString()
        //     }]);

        // if (logError) console.warn('Log insert failed:', logError.message);

        // 2. Update Influence & Alignment (World)
        // プレイヤーの現在地をDBから動的に取得
        const { data: locProfile } = await supabase.from('user_profiles').select('current_location_id').eq('id', user.id).single();
        let playerLocationName = '名もなき旅人の拠所'; // フォールバック
        if (locProfile?.current_location_id) {
            const { data: locData } = await supabase.from('locations').select('name').eq('id', locProfile.current_location_id).single();
            if (locData?.name) playerLocationName = locData.name;
        }

        let { data: currentWorld } = await supabase
            .from('world_states')
            .select('*')
            .eq('location_name', playerLocationName)
            .single();

        if (!currentWorld) {
            console.log(`World state missing for ${playerLocationName}, using fallback hub state...`);
            const { data: fallbackWorld } = await supabase
                .from('world_states')
                .select('*')
                .eq('location_name', '名もなき旅人の拠所')
                .single();
            currentWorld = fallbackWorld;
            if (!currentWorld) {
                console.error("No world state found at all");
                return NextResponse.json({ error: 'No world state found' }, { status: 500 });
            }
        }

        // Apply impacts
        let finalImpacts = impacts;

        // Refactor body read
        // The first line "const { action, impacts } = ..." consumed the body. 
        // We cannot read it again if we already destructured.
        // Wait, I should replace the top line too? 
        // Let's assume I will replace the extraction logic entirely in a bigger block.

        // ... (This replacing strategy is finding it hard to verify what lines I'm replacing)
        // Let's do a bigger chunk replacement starting from line 7.

        // Actually, let's just use the variables we have if we assume we changed line 7?
        // No, I haven't changed line 7 yet. 
        // I will do the body parsing change and Logic change in one go.

        // New Logic: 
        // 1. If scenario_id provided, fetch from DB.
        // 2. Otherwise fall back to provided impacts (or maybe Reject? For now, fallback for debug).

        if (scenario_id) {
            const { data: scen, error: sErr } = await supabase.from('scenarios').select('*').eq('id', scenario_id).single();
            if (scen) {
                finalImpacts = {
                    order: scen.order_impact || 0,
                    chaos: scen.chaos_impact || 0,
                    justice: scen.justice_impact || 0,
                    evil: scen.evil_impact || 0
                };
            }
        }

        const incOrder = finalImpacts?.order ?? 0;
        const incChaos = finalImpacts?.chaos ?? 0;
        const incJustice = finalImpacts?.justice ?? 0;
        const incEvil = finalImpacts?.evil ?? 0;

        const newOrder = (currentWorld.order_score || 10) + incOrder;
        const newChaos = (currentWorld.chaos_score || 10) + incChaos;
        const newJustice = (currentWorld.justice_score || 10) + incJustice;
        const newEvil = (currentWorld.evil_score || 10) + incEvil;

        console.log(`[API/Report] Updating Scores: O:${newOrder} C:${newChaos} J:${newJustice} E:${newEvil}`);

        // Update DB directly
        const { error: updateError } = await supabase
            .from('world_states')
            .update({
                order_score: newOrder,
                chaos_score: newChaos,
                justice_score: newJustice,
                evil_score: newEvil,
            })
            .eq('id', currentWorld.id);

        if (updateError) {
            console.error('State update failed:', updateError);
            throw updateError;
        }

        // --- 3. Update User Profile & Title ---
        // For now, fetch the first profile (Demo Mode)
        let shareDataList: any[] = [];
        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
        if (profile) {

            const newOrderPts = (profile.order_pts || 0) + incOrder;
            const newChaosPts = (profile.chaos_pts || 0) + incChaos;
            const newJusticePts = (profile.justice_pts || 0) + incJustice;
            const newEvilPts = (profile.evil_pts || 0) + incEvil;

            // ... (in function)

            // Title Logic (割合ベースの称号判定)
            const profileForTitle = {
                ...profile,
                order_pts: newOrderPts,
                chaos_pts: newChaosPts,
                justice_pts: newJusticePts,
                evil_pts: newEvilPts,
            };
            const newTitle = calculateTitle(profileForTitle);

            // Update Profile
            await supabase
                .from('user_profiles')
                .update({
                    order_pts: newOrderPts,
                    chaos_pts: newChaosPts,
                    justice_pts: newJusticePts,
                    evil_pts: newEvilPts,
                    title_name: newTitle,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            console.log(`[API/Report] Profile Updated: ${newTitle} (O:${newOrderPts} C:${newChaosPts} J:${newJusticePts} E:${newEvilPts})`);

                // #8 称号Tier昇格チェック (世代1回)
                if (newTitle !== (profile.title_name || '名もなき旅人')) {
                    if (isTierUpgrade(profile.title_name || '名もなき旅人', newTitle)) {
                        const newTier = getTitleTier(newTitle);
                        const fired = await checkAndFireTrigger(supabase, profile.id, 'title_tier_up', newTier);
                        if (fired) {
                            const flavor = getFlavor('title_tier', newTier);
                            const sd = buildShareData('title_tier_up', { title: newTitle, flavor });
                            if (sd) shareDataList.push(sd);
                        }
                    }
                }
        }
        // --------------------------------------

        // Trigger admin update to refresh status/attributes

        // Trigger admin update to refresh status/attributes
        try {
            // Await to ensure we get proper result before returning to client
            const origin = req.headers.get('origin') || req.headers.get('host') ? `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}` : 'http://localhost:3000';
            await fetch(`${origin}/api/admin/update-world`, {
                method: 'POST',
                body: JSON.stringify({ id: WORLD_ID, location_name: playerLocationName })
            });
        } catch (e) {
            console.error("Trigger update failed", e);
        }

        return NextResponse.json({
            success: true,
            message: 'World influence updated',
            share_data_list: shareDataList,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

