process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.DASHBOARD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY exists?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('DASHBOARD_SUPABASE_SERVICE_ROLE_KEY exists?', !!process.env.DASHBOARD_SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWebhookEvents() {
  console.log('\n--- Fetching recent stripe_webhook_events with types ---');
  const { data: webhooks, error } = await supabase
    .from('stripe_webhook_events')
    .select('id, type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching webhook events:', error.message);
    return;
  }

  console.log('Webhook Events detail:');
  console.dir(webhooks, { depth: null });
}

checkWebhookEvents();
