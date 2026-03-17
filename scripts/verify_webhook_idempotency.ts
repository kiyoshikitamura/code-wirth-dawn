import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("=== Webhook Idempotency Verification ===");
    
    const eventId = `test_evt_${Date.now()}`;
    console.log(`Testing with Event ID: ${eventId}`);

    // Simulate first insertion (Webhook invocation 1)
    const { data: d1, error: e1 } = await supabase
        .from('stripe_webhook_events')
        .insert({ id: eventId, type: 'checkout.session.completed' });
    
    if (e1) {
        console.error("1st Invocation failed (unexpected):", e1.message);
    } else {
        console.log("1st Invocation succeeded. Event registered.");
    }

    // Simulate second insertion with same ID (Webhook invocation 2)
    const { data: d2, error: e2 } = await supabase
        .from('stripe_webhook_events')
        .insert({ id: eventId, type: 'checkout.session.completed' });

    if (e2 && e2.code === '23505') {
        console.log("2nd Invocation successfully blocked by Unique Constraint. Idempotency is working!");
    } else if (e2) {
        console.error("2nd Invocation failed with unknown error:", e2.message);
    } else {
        console.error("CRITICAL SECURITY FAILURE: 2nd Invocation succeeded! Idempotency check failed.");
    }
}

run();
