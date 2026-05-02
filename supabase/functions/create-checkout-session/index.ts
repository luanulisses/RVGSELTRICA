import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.1.1?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const stripePriceId = Deno.env.get('STRIPE_PRICE_ID')

    if (!stripeSecretKey || !stripePriceId) {
        return new Response(
            JSON.stringify({
                error: 'Ambiente não configurado. As variáveis STRIPE_SECRET_KEY e STRIPE_PRICE_ID precisam ser definidas no Supabase.',
                details: 'Use "npx supabase secrets set STRIPE_SECRET_KEY=... STRIPE_PRICE_ID=..." para configurar.'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2022-11-15',
        httpClient: Stripe.createFetchHttpClient(),
    });

    try {
        const authHeader = req.headers.get('Authorization')!
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        const bodyJson = await req.json();
        const return_url = bodyJson.return_url;
        const isPix = bodyJson.isPix;
        const monthsParam = parseInt(bodyJson.months) || 1;

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get current billing status
        const { data: billingData, error: fetchError } = await supabaseAdmin
            .from('system_billing')
            .select('*')
            .maybeSingle()

        if (fetchError) {
            console.error('Error fetching billing data:', fetchError);
            throw new Error('Data fetch failed');
        }

        let customerId = billingData?.stripe_customer_id

        if (!customerId) {
            console.log('No stripe customer id, creating one for:', user.email);
            // Create a new customer in Stripe if none exists
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id
                }
            });
            customerId = customer.id;

            // Save it to Supabase
            if (billingData?.id) {
                const { error: updateError } = await supabaseAdmin
                    .from('system_billing')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', billingData.id);

                if (updateError) console.error('Error updating customer ID:', updateError);
            } else {
                const { error: insertError } = await supabaseAdmin
                    .from('system_billing')
                    .insert([{ stripe_customer_id: customerId, subscription_active: false }]);

                if (insertError) console.error('Error inserting new record:', insertError);
            }
        }

        // Usually you'd fetch a price ID from somewhere, but for this let's assume
        // the price ID is stored in env STRIPE_PRICE_ID
        const priceId = Deno.env.get('STRIPE_PRICE_ID')

        if (!priceId) {
            throw new Error('STRIPE_PRICE_ID is not configured in environment variables');
        }

        let session;

        if (isPix) {
            // Fetch the regular subscription price to get its amount
            const price = await stripe.prices.retrieve(priceId);
            
            // req.json() was already consumed earlier, so we use the variable we extracted at the top.
            // Also need to get 'months' from the first req.json() destructuring if available,
            // or just read it from the destructured variable below.
            // Wait, we didn't destructure `months` earlier. Let's fix that too.
            // I'll grab months off the req object that I parsed. Oh wait I can't.
            // I must re-destructure at the top.
            // For now, I'll assume we'll fix it in two steps or I'll just change the top.

            // Base calculation
            let finalAmount = price.unit_amount * monthsParam;

            // Apply 10% discount if 3 or more months
            let discountApplied = false;
            if (monthsParam >= 3) {
                finalAmount = Math.round(finalAmount * 0.90);
                discountApplied = true;
            }

            const productName = `Acesso RVGS Premium - ${monthsParam} Mês(es)`;
            const productDesc = discountApplied ? `Acesso de ${monthsParam} meses ao sistema (Pgto Único via PIX com 10% Off)` : `Acesso de ${monthsParam} mês ao sistema (Pgto Único via PIX)`;


            session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['pix'],
                line_items: [
                    {
                        price_data: {
                            currency: price.currency,
                            product_data: {
                                name: productName,
                                description: productDesc,
                            },
                            unit_amount: finalAmount,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                metadata: {
                    is_pix_one_month: 'true', // preserving old flag name for backward-compat
                    pix_months: String(monthsParam)
                },
                success_url: `${return_url}?success=true`,
                cancel_url: `${return_url}?canceled=true`,
            });
        } else {
            // Regulas subscription flow with cards
            session = await stripe.checkout.sessions.create({
                customer: customerId,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${return_url}?success=true`,
                cancel_url: `${return_url}?canceled=true`,
            });
        }

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error) {
        console.error('Checkout Session Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error occurred' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
