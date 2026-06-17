process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

// 本番環境の Stripe Secret Key を取得
const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  console.error('STRIPE_SECRET_KEY not found in env files.');
  process.exit(1);
}

const stripe = new Stripe(stripeSecret);

// 直近の330円決済に対応すると思われる Webhook イベントID
const eventId = 'evt_1Tj0SKGoJCaTojlf7EjoiJz2'; 

async function inspectEvent() {
  try {
    console.log(`Fetching Stripe event ${eventId}...`);
    const event = await stripe.events.retrieve(eventId);
    
    console.log('\nEvent Type:', event.type);
    console.log('Event Object Type:', event.data.object.object);
    
    const session = event.data.object;
    
    console.log('\n--- Session details ---');
    console.log('Session ID:', session.id);
    console.log('Mode:', session.mode);
    console.log('Customer:', session.customer);
    console.log('Client Reference ID:', session.client_reference_id);
    console.log('Metadata:', session.metadata);
    console.log('Amount Total:', session.amount_total);
    console.log('Payment Status:', session.payment_status);
    console.log('Subscription ID:', session.subscription);

    if (session.id) {
        console.log('\nFetching line items for this session...');
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        console.log('Line Items Price details:');
        console.dir(lineItems.data.map(item => ({
            id: item.id,
            description: item.description,
            price_id: item.price ? item.price.id : null,
            amount_total: item.amount_total
        })), { depth: null });
    }

  } catch (err) {
    console.error('Error fetching event from Stripe:', err.message);
  }
}

inspectEvent();
