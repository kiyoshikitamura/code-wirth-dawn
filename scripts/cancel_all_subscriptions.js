const path = require('path');
const fs = require('fs');

// 読み込む .env ファイルの候補
const envFiles = [
  '.env.vercel.real_production.local',
  '.env.production.local',
  '.env.vercel.production.local',
  '.env.local',
  '.env'
];

let dotenvLoaded = false;
let loadedFile = '';

for (const file of envFiles) {
  const envPath = path.join(__dirname, '..', file);
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, override: true });
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.log(`Loaded env file: ${file}`);
      loadedFile = file;
      dotenvLoaded = true;
      break;
    }
  }
}

if (!dotenvLoaded) {
  console.error("No env file found with a valid STRIPE_SECRET_KEY (sk_...).");
  process.exit(1);
}

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover', // API Version
});

async function main() {
  const list = [];
  
  // 1. active subscriptions
  let hasMore = true;
  let startingAfter = undefined;
  while (hasMore) {
    const res = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      starting_after: startingAfter
    });
    list.push(...res.data);
    if (res.has_more) {
      startingAfter = res.data[res.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  // 2. trialing subscriptions
  hasMore = true;
  startingAfter = undefined;
  while (hasMore) {
    const res = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100,
      starting_after: startingAfter
    });
    list.push(...res.data);
    if (res.has_more) {
      startingAfter = res.data[res.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${list.length} subscriptions in total to process.`);
  
  let count = 0;
  for (const sub of list) {
    if (sub.cancel_at_period_end) {
      console.log(`Subscription ${sub.id} is already scheduled to cancel at period end. Skipping.`);
      continue;
    }

    let customerEmail = 'Unknown';
    try {
      const customer = await stripe.customers.retrieve(sub.customer);
      customerEmail = customer.email || 'No Email';
    } catch (e) {
      console.error(`Failed to retrieve customer ${sub.customer}:`, e.message);
    }

    // current_period_end の安全なフォールバック
    const periodEndSec = sub.current_period_end || sub.items?.data[0]?.current_period_end;
    const currentPeriodEnd = periodEndSec ? new Date(periodEndSec * 1000).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : 'N/A';
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : null;
    
    let finalCancelDate = currentPeriodEnd;
    if (sub.status === 'trialing' && trialEnd) {
      finalCancelDate = trialEnd;
    }

    console.log(`Setting cancel_at_period_end = true for subscription:
- Sub ID: ${sub.id}
- Customer: ${sub.customer} (${customerEmail})
- User ID: ${sub.metadata?.user_id || 'N/A'}
- Status: ${sub.status}
- Final Cancel Date: ${finalCancelDate}
`);

    try {
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true
      });
      count++;
    } catch (updateErr) {
      console.error(`Failed to update subscription ${sub.id}:`, updateErr.message);
    }
  }

  console.log(`Successfully updated ${count} subscriptions to cancel at period end.`);
}

main().catch(console.error);
