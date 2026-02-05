// Netlify Serverless Function — Verify Subscription Status
// Checks a user's active Stripe subscription status

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  if (!process.env.STRIPE_SECRET_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe not configured' }) };
  }

  try {
    const { userEmail } = JSON.parse(event.body);
    if (!userEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userEmail' }) };
    }

    // Find customer by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ tier: 'free', status: 'no_customer' }) };
    }

    const customer = customers.data[0];

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for past_due or trialing
      const allSubs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
      });

      if (allSubs.data.length > 0) {
        const sub = allSubs.data[0];
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            tier: 'free',
            status: sub.status,
            cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
          }),
        };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ tier: 'free', status: 'no_subscription' }) };
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price?.id;

    // Map price IDs to tiers
    const PRICE_TIER_MAP = {
      [process.env.STRIPE_PRICE_STANDARD_MONTHLY]: 'standard',
      [process.env.STRIPE_PRICE_STANDARD_ANNUAL]: 'standard',
      [process.env.STRIPE_PRICE_PRO_MONTHLY]: 'pro',
      [process.env.STRIPE_PRICE_PRO_ANNUAL]: 'pro',
    };

    const tier = PRICE_TIER_MAP[priceId] || 'standard';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        tier,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId,
      }),
    };
  } catch (error) {
    console.error('Verify subscription error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
