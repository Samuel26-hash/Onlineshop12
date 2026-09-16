import Stripe from 'stripe';

export async function onRequestPost(context) {
  try {
    // Greift auf die Cloudflare Environment Variable 'Lenny' zu
    const stripe = new Stripe(context.env.Lenny);

    // Liest den Warenkorb aus der Anfrage
    const { cart } = await context.request.json();

    if (!cart || cart.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Der Warenkorb ist leer.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const line_items = cart.map(item => ({
      price_data: {
        currency: 'chf',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty || 1,
    }));

    // Erstellt die Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${new URL(context.request.url).origin}/?success=true`,
      cancel_url: `${new URL(context.request.url).origin}/`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error("Stripe Fehler:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
