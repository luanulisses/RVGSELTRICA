import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Using service role to bypass RLS when updating billing info from webhook
const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (request) => {
    const signature = request.headers.get('Stripe-Signature')

    // First step is to verify the event. The .text() method must be used as the
    // verification relies on the raw request body rather than the parsed JSON.
    const body = await request.text()
    let receivedEvent
    try {
        receivedEvent = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!,
            undefined,
            cryptoProvider
        )
    } catch (err) {
        return new Response(err.message, { status: 400 })
    }

    try {
        const event = receivedEvent

        // Handle the event
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object
                const status = subscription.status
                // Assuming we track the customer id to know who it is, but here we just have 1 global row
                // Ideally we'd match the customer ID, but since this is for the *owner*
                // we update the single row we have, matching the customer ID.
                const isActive = status === 'active' || status === 'trialing'
                const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

                const { error } = await supabaseAdmin
                    .from('system_billing')
                    .update({
                        subscription_active: isActive,
                        stripe_subscription_id: subscription.id,
                        current_period_end: currentPeriodEnd
                    })
                    .eq('stripe_customer_id', subscription.customer as string)

                if (error) {
                    console.error('Error updating billing state', error)
                    throw error
                }

                break
            }

            case 'checkout.session.completed': {
                const session = event.data.object;

                if (session.metadata?.is_pix_one_month === 'true' && session.payment_status === 'paid') {
                    const customerId = session.customer as string;

                    // Fetch current billing
                    const { data: billingInfo, error: fetchErr } = await supabaseAdmin
                        .from('system_billing')
                        .select('current_period_end')
                        .eq('stripe_customer_id', customerId)
                        .maybeSingle();

                    if (fetchErr) {
                         console.error('Error fetching billing info for pix', fetchErr);
                         throw fetchErr;
                    }

                    if (billingInfo) {
                        const now = new Date();
                        let newPeriodEnd = new Date();

                        if (billingInfo.current_period_end) {
                            const currentEnd = new Date(billingInfo.current_period_end);
                            if (currentEnd > now) {
                                // Add 30 days to existing end
                                newPeriodEnd = currentEnd;
                            }
                        }

                        const monthsToAdd = parseInt(session.metadata?.pix_months || '1', 10);
                        // Add 30 days * months
                        newPeriodEnd.setDate(newPeriodEnd.getDate() + (30 * monthsToAdd));

                        const { error: updateErr } = await supabaseAdmin
                            .from('system_billing')
                            .update({
                                subscription_active: true,
                                current_period_end: newPeriodEnd.toISOString()
                            })
                            .eq('stripe_customer_id', customerId);

                         if (updateErr) {
                             console.error('Error updating billing state for PIX', updateErr);
                             throw updateErr;
                         }
                    } else {
                        console.error('Webhook received for PIX session but no customer found in billing table');
                    }
                }
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`)
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 })
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
