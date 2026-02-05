// Netlify Serverless Function — Stripe Checkout Session
// Creates a Stripe Checkout session for subscription payments

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
    const { priceId, userId, userEmail, successUrl, cancelUrl } = JSON.parse(event.body);

    if (!priceId || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing priceId or userId' }) };
    }

    // Look up or create Stripe customer
    let customer;
    const existing = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: { firebaseUid: userId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${process.env.URL || 'https://readyhiretool.netlify.app'}/`,
      cancel_url: cancelUrl || `${process.env.URL || 'https://readyhiretool.netlify.app'}/`,
      metadata: { firebaseUid: userId },
      subscription_data: {
        metadata: { firebaseUid: userId },
      },
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
