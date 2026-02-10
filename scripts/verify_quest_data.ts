
import { supabase } from '../src/lib/supabase';

async function verify() {
    console.log("Checking Scenarios...");
    const { data: scenarios, error } = await supabase
        .from('scenarios')
        .select('id, title, rec_level, is_urgent, difficulty')
        .limit(10);

    if (error) {
        console.error("Error fetching scenarios:", error);
        return;
    }

    console.table(scenarios);

    console.log("Checking User Profile (first one)...");
    const { data: users, error: uError } = await supabase
        .from('user_profiles')
        .select('id, title_name, level, vitality')
        .limit(1);

    if (uError) {
        console.error("Error fetching user:", uError);
    } else {
        console.table(users);
    }
}

verify();
