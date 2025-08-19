import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create Supabase client with service role for database writes
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    console.log(`Payment verification for session: ${session_id}`);
    console.log(`Payment status: ${session.payment_status}`);

    if (session.payment_status === 'paid') {
      // Payment successful, update database
      const userId = session.metadata?.user_id;
      
      if (userId) {
        // Update order status
        const { error: orderError } = await supabaseClient
          .from('orders')
          .update({ 
            payment_status: 'completed',
            stripe_session_id: session_id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('stripe_session_id', session_id);

        if (orderError) {
          console.error('Error updating order:', orderError);
        }

        // Create notification
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: userId,
            pesan: 'Pembayaran berhasil! Terima kasih atas pembelian Anda.',
            tipe: 'success'
          });

        console.log(`Payment verified and database updated for user: ${userId}`);
      }

      return new Response(JSON.stringify({
        success: true,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({
      success: false,
      payment_status: session.payment_status,
      message: "Payment not completed yet"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Error verifying payment" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});