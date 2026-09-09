const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  try {
    // Greife auf 'cart' zu (so wie es von index.html gesendet wird)
    const { cart } = JSON.parse(event.body);

    if (!cart || cart.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Der Warenkorb ist leer.' }),
      };
    }

    // Wandle die Produkte für Stripe um
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'chf',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // Rappen/Cent-Betrag
      },
      quantity: item.qty || 1,
    }));

    // Erstelle die Stripe Checkout-Sitzung
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${event.headers.origin || 'https://' + event.headers.host}/?success=true`,
      cancel_url: `${event.headers.origin || 'https://' + event.headers.host}/`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe Fehler:', err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
