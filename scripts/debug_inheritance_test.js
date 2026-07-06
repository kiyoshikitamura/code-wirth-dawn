process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const userId = 'af2848d0-40f2-4f75-bd2b-ac633184107c'; // プレビュー検証用ユーザー

const cmd = process.argv[2];

async function run() {
    if (!cmd || cmd === 'status') {
        console.log(`[Status] Fetching stats for user ${userId}...`);
        const { data: p, error: pe } = await supabase
            .from('user_profiles')
            .select('id, name, level, is_alive, vitality, max_vitality, gold, subscription_tier, legacy_points, current_location_id, current_quest_id')
            .eq('id', userId)
            .maybeSingle();

        if (pe) {
            console.error('Error fetching profile:', pe);
            return;
        }
        if (!p) {
            console.log('User profile not found.');
            return;
        }

        console.log('\n--- User Profile Status ---');
        console.log(`Name:        ${p.name}`);
        console.log(`Level:       ${p.level}`);
        console.log(`Alive:       ${p.is_alive}`);
        console.log(`Vitality:    ${p.vitality} / ${p.max_vitality}`);
        console.log(`Gold:        ${p.gold} G`);
        console.log(`Sub Tier:    ${p.subscription_tier}`);
        console.log(`Legacy Pts:  ${p.legacy_points} LP (BP: ${Math.floor(p.legacy_points / 300)} BP)`);
        console.log(`Location ID: ${p.current_location_id}`);
        console.log(`Quest ID:    ${p.current_quest_id || 'None'}`);

        // Fetch completed quests
        const { data: completed, error: ce } = await supabase
            .from('user_completed_quests')
            .select('scenario_id')
            .eq('user_id', userId);

        if (ce) {
            console.error('Error fetching completed quests:', ce);
        } else {
            console.log('Completed Quests:', completed.map(q => q.scenario_id).join(', '));
        }

        // Fetch scenario 6015 info
        const { data: scen, error: seErr } = await supabase
            .from('scenarios')
            .select('id, slug, title')
            .eq('id', 6015)
            .maybeSingle();
        console.log('Scenario 6015 in DB:', scen || seErr);

        // Fetch heroic spirits count
        const { data: heroics, error: he } = await supabase
            .from('party_members')
            .select('id, name, level, is_active')
            .eq('owner_id', userId)
            .eq('origin_type', 'shadow_heroic')
            .eq('is_active', false);

        if (he) {
            console.error('Error fetching heroics:', he);
        } else {
            console.log(`Heroic Spirits registered: ${heroics.length}`);
            heroics.forEach(h => {
                console.log(`  - ${h.name} (Lv.${h.level})`);
            });
        }
        return;
    }

    if (cmd === 'kill') {
        console.log(`[Kill] Setting user ${userId} vitality to 0...`);
        const { error } = await supabase
            .from('user_profiles')
            .update({ vitality: 0 })
            .eq('id', userId);

        if (error) {
            console.error('Error setting vitality to 0:', error);
        } else {
            console.log('Successfully set vitality to 0. Refresh game page to trigger forced retirement!');
        }
        return;
    }

    if (cmd === 'active') {
        console.log(`[Active] Resetting user ${userId} to active alive state...`);
        const { error } = await supabase
            .from('user_profiles')
            .update({ 
                is_alive: true, 
                vitality: 100, 
                max_vitality: 100,
                current_quest_id: null
            })
            .eq('id', userId);

        if (error) {
            console.error('Error resetting profile:', error);
        } else {
            console.log('Successfully reset character to alive and fully active (VIT: 100).');
        }
        return;
    }

    if (cmd === 'set-tier') {
        const tier = process.argv[3];
        if (!['free', 'basic', 'premium'].includes(tier)) {
            console.error('Invalid tier. Choose from: free, basic, premium');
            return;
        }
        console.log(`[Set-Tier] Setting user ${userId} tier to '${tier}'...`);
        const { error } = await supabase
            .from('user_profiles')
            .update({ subscription_tier: tier })
            .eq('id', userId);

        if (error) {
            console.error('Error setting tier:', error);
        } else {
            console.log(`Successfully updated subscription tier to '${tier}'.`);
        }
        return;
    }

    if (cmd === 'set-lp') {
        const lp = parseInt(process.argv[3], 10);
        if (isNaN(lp) || lp < 0) {
            console.error('Invalid LP value. Must be a non-negative number.');
            return;
        }
        console.log(`[Set-LP] Setting user ${userId} legacy_points to ${lp}...`);
        const { error } = await supabase
            .from('user_profiles')
            .update({ legacy_points: lp })
            .eq('id', userId);

        if (error) {
            console.error('Error setting legacy_points:', error);
        } else {
            console.log(`Successfully set legacy_points to ${lp} LP.`);
        }
        return;
    }

    if (cmd === 'ready-6023') {
        console.log(`[Ready-6023] Preparing user ${userId} for Quest 6023 (main_ep15_extra)...`);
        
        // 1. Mark main_ep15 (ID 6015) as completed
        const { data: existing } = await supabase
            .from('user_completed_quests')
            .select('*')
            .eq('user_id', userId)
            .eq('scenario_id', 6015)
            .maybeSingle();

        if (!existing) {
            const { error: compError } = await supabase
                .from('user_completed_quests')
                .insert({ user_id: userId, scenario_id: 6015 });
            if (compError) {
                console.error('Error marking 6015 as completed:', compError);
            } else {
                console.log('Successfully marked Quest 6015 (main_ep15) as completed.');
            }
        } else {
            console.log('Quest 6015 (main_ep15) is already completed.');
        }

        // 2. Clear current quest ID
        const { error: profError } = await supabase
            .from('user_profiles')
            .update({ current_quest_id: null })
            .eq('id', userId);

        if (profError) {
            console.error('Error clearing current_quest_id:', profError);
        } else {
            console.log('Successfully cleared current_quest_id.');
        }
        return;
    }

    if (cmd === 'ready-6022') {
        console.log(`[Ready-6022] Preparing user ${userId} for Quest 6022 (qst_heritage_training)...`);
        
        // 1. Mark main_ep15_extra (ID 6023) as completed
        const { data: existing } = await supabase
            .from('user_completed_quests')
            .select('*')
            .eq('user_id', userId)
            .eq('scenario_id', 6023)
            .maybeSingle();

        if (!existing) {
            const { error: compError } = await supabase
                .from('user_completed_quests')
                .insert({ user_id: userId, scenario_id: 6023 });
            if (compError) {
                console.error('Error marking 6023 as completed:', compError);
            } else {
                console.log('Successfully marked Quest 6023 (main_ep15_extra) as completed.');
            }
        } else {
            console.log('Quest 6023 (main_ep15_extra) is already completed.');
        }

        // 2. Ensure generation >= 2 by inserting a dummy retired character
        const { error: retireError } = await supabase
            .from('retired_characters')
            .insert({
                user_id: userId,
                name: '先代の英雄',
                age_days: 365,
                cause_of_death: 'retire',
                completed_quests_count: 15
            });

        if (retireError) {
            console.error('Error inserting retired character:', retireError);
        } else {
            console.log('Successfully added a retired character (user is now considered Gen 2+).');
        }

        // 3. Clear current quest ID
        const { error: profError } = await supabase
            .from('user_profiles')
            .update({ current_quest_id: null })
            .eq('id', userId);

        if (profError) {
            console.error('Error clearing current_quest_id:', profError);
        } else {
            console.log('Successfully cleared current_quest_id.');
        }
        return;
    }

    if (cmd === 'revive') {
        console.log(`[Revive] Setting user ${userId} to alive...`);
        const { error } = await supabase
            .from('user_profiles')
            .update({
                is_alive: true,
                vitality: 80
            })
            .eq('id', userId);

        if (error) {
            console.error('Error reviving user:', error);
        } else {
            console.log('Successfully revived user profile and set vitality to 80.');
        }
        return;
    }

    if (cmd === 'restore-profile') {
        console.log(`[Restore-Profile] Fetching latest historical log for user ${userId}...`);
        const { data: log, error: logErr } = await supabase
            .from('historical_logs')
            .select('*')
            .eq('user_id', userId)
            .order('death_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (logErr) {
            console.error('Error fetching historical log:', logErr);
            return;
        }

        if (!log) {
            console.error('No historical log found. Cannot restore.');
            return;
        }

        const snapshot = log.data;
        console.log('Restoring from death date:', log.death_date);

        // 1. Restore user_profiles stats to pre-death state
        const { error: profErr } = await supabase
            .from('user_profiles')
            .update({
                is_alive: true,
                name: 'きたむ（プレビュー）',
                avatar_url: '/avatars/adventurer.jpg',
                level: 20,
                gold: 79900,
                legacy_points: 0,
                vitality: 86,
                max_vitality: 96,
                hp: 96,
                max_hp: 96,
                atk: 25,
                def: 20,
                max_deck_cost: 30,
                current_quest_id: null
            })
            .eq('id', userId);

        if (profErr) {
            console.error('Error restoring profile stats:', profErr);
            return;
        }
        console.log('Successfully restored user_profiles stats.');

        // 2. Delete the registered heroic spirit from party_members
        const { error: heroicErr } = await supabase
            .from('party_members')
            .delete()
            .eq('owner_id', userId)
            .eq('origin_type', 'shadow_heroic');

        if (heroicErr) {
            console.error('Error deleting registered heroic spirit:', heroicErr);
        } else {
            console.log('Successfully deleted the registered heroic spirit.');
        }

        // 3. Delete the retired character record in retired_characters
        const { error: retiredErr } = await supabase
            .from('retired_characters')
            .delete()
            .eq('user_id', userId);

        if (retiredErr) {
            console.error('Error deleting retired character record:', retiredErr);
        } else {
            console.log('Successfully deleted the retired character record.');
        }

        // 4. Restore inventory items
        console.log('Restoring inventory items from snapshot...');
        await supabase.from('inventory').delete().eq('user_id', userId);

        if (snapshot.heirloom_item_ids && snapshot.heirloom_item_ids.length > 0) {
            const inserts = snapshot.heirloom_item_ids.map(id => ({
                user_id: userId,
                item_id: Number(id),
                quantity: 1,
                is_equipped: false
            }));
            const { error: invErr } = await supabase.from('inventory').insert(inserts);
            if (invErr) {
                console.error('Error inserting inventory items:', invErr);
            } else {
                console.log('Successfully restored inventory items:', snapshot.heirloom_item_ids);
            }
        }

        // 5. Delete the latest historical log
        const { error: delLogErr } = await supabase
            .from('historical_logs')
            .delete()
            .eq('id', log.id);
        if (delLogErr) {
            console.error('Error deleting historical log:', delLogErr);
        } else {
            console.log('Successfully deleted the temporary historical log.');
        }

        return;
    }

    if (cmd === 'dump-logs') {
        console.log(`[Dump-Logs] Fetching historical logs for user ${userId}...`);
        const { data: logs, error } = await supabase
            .from('historical_logs')
            .select('*')
            .eq('user_id', userId);
        if (error) {
            console.error('Error fetching logs:', error);
        } else {
            console.log(JSON.stringify(logs, null, 2));
        }
        return;
    }

    if (cmd === 'restore-name') {
        console.log(`[Restore-Name] Restoring name and avatar for user ${userId}...`);
        const { error } = await supabase
            .from('user_profiles')
            .update({
                name: 'きたむ（プレビュー）',
                avatar_url: '/avatars/adventurer.jpg'
            })
            .eq('id', userId);
        if (error) {
            console.error('Error restoring name/avatar:', error);
        } else {
            console.log('Successfully restored player name to "きたむ（プレビュー）" and default avatar.');
        }
        return;
    }

    console.error(`Unknown command '${cmd}'. Use: status, kill, active, set-tier <tier>, set-lp <value>, ready-6023, ready-6022, revive, dump-logs, restore-name`);
}

run();
