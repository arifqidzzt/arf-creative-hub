import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { kode } = await req.json();

    if (!kode) {
      return new Response(JSON.stringify({ error: 'Redeem code is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check if redeem code exists and is active
    const { data: redeemCode, error: redeemError } = await supabaseClient
      .from('redeem_codes')
      .select('*')
      .eq('kode', kode)
      .eq('status', 'active')
      .single();

    if (redeemError || !redeemCode) {
      return new Response(JSON.stringify({ error: 'Invalid or expired redeem code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Check if code has expiry and is not expired
    if (redeemCode.expires_at && new Date(redeemCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Redeem code has expired' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Mark code as used
    const { error: updateError } = await supabaseClient
      .from('redeem_codes')
      .update({
        status: 'used',
        used_by: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', redeemCode.id);

    if (updateError) {
      throw updateError;
    }

    // Create notification for user
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        pesan: `Selamat! Anda telah berhasil menukar kode redeem dan mendapatkan: ${redeemCode.reward}`,
        tipe: 'success'
      });

    console.log(`Redeem code ${kode} used by user ${user.id}`);

    return new Response(JSON.stringify({ 
      message: 'Redeem code successfully used',
      reward: redeemCode.reward 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in redeem function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});