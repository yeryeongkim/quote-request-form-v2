import Stripe from 'stripe';

const SUPABASE_URL = 'https://zhnhdacjqeclggubhths.supabase.co';
const HOST_FEE_PAYMENT_LINK = 'https://buy.stripe.com/test_14AeVd9n5csEbPA6Q0dUY04';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentLinkId = session.payment_link;
      const customerEmail = session.customer_details?.email;

      console.log('Processing:', { paymentLinkId, customerEmail });

      if (!paymentLinkId || !customerEmail) {
        return res.status(200).json({ received: true, message: 'Missing data' });
      }

      // Check if this is the host fee payment link
      // We check by payment link ID (plink_1SfMOqHn6Gv4I1GxUQWhBQz8)
      const HOST_FEE_PAYMENT_LINK_ID = 'plink_1SfMOqHn6Gv4I1GxUQWhBQz8';
      let isHostFeePayment = paymentLinkId === HOST_FEE_PAYMENT_LINK_ID;

      // If not matching by ID, try to get URL from Stripe
      if (!isHostFeePayment) {
        try {
          const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
          isHostFeePayment = paymentLink.url === HOST_FEE_PAYMENT_LINK;
          console.log('Payment link URL:', paymentLink.url);
        } catch (stripeErr) {
          console.log('Could not retrieve payment link, using ID match only:', stripeErr.message);
        }
      }

      console.log('Is host fee payment:', isHostFeePayment);

      if (isHostFeePayment) {
        // Find profile using direct REST API call
        const profileResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?email=ilike.${encodeURIComponent(customerEmail)}&select=id`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        );
        const profiles = await profileResponse.json();

        console.log('Profiles found:', profiles);

        if (profiles && profiles.length > 0) {
          const profileId = profiles[0].id;

          // Update profile
          const updateResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${profileId}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                fee_paid: true,
                fee_paid_at: new Date().toISOString(),
              }),
            }
          );

          console.log('Update status:', updateResponse.status);

          return res.status(200).json({
            received: true,
            message: 'Host fee confirmed',
            profile_id: profileId,
          });
        }
        return res.status(200).json({ received: true, message: 'No profile found', email: customerEmail });
      }

      return res.status(200).json({ received: true, message: 'Not host fee payment' });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
