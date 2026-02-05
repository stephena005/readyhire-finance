// Netlify Serverless Function — Stripe Webhook Handler
// Handles subscription lifecycle events from Stripe

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    console.error('Missing stripe signature or webhook secret');
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing signature' }) };
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        const firebaseUid = session.metadata?.firebaseUid;
        const subscriptionId = session.subscription;
        console.log(`Checkout completed for user ${firebaseUid}, subscription ${subscriptionId}`);
        // The frontend will verify subscription status via verify-subscription function
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        const firebaseUid = subscription.metadata?.firebaseUid;
        console.log(`Subscription updated for user ${firebaseUid}: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const firebaseUid = subscription.metadata?.firebaseUid;
        console.log(`Subscription cancelled for user ${firebaseUid}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object;
        console.log(`Payment failed for customer ${invoice.customer}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
};
