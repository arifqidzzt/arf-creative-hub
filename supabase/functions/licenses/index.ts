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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
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

    const method = req.method;

    if (method === 'GET') {
      // Get user's licenses
      const { data: licenses, error } = await supabaseClient
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ licenses }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (method === 'POST') {
      // Create a new license (usually from order completion)
      const { product_id, order_id, kode_lisensi } = await req.json();

      if (!product_id) {
        return new Response(JSON.stringify({ error: 'Product ID is required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Get product details
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', product_id)
        .single();

      if (productError || !product) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      // Generate license code if not provided
      const licenseCode = kode_lisensi || `${product.kategori.toUpperCase()}${Date.now().toString().slice(-6)}`;

      // Create license
      const { data: license, error: licenseError } = await supabaseClient
        .from('licenses')
        .insert({
          user_id: user.id,
          product_id,
          kode_lisensi: licenseCode,
          aktif: true,
          tutorial: `Tutorial untuk ${product.nama_produk}:\n1. Download produk dari link yang disediakan\n2. Ekstrak file jika berupa ZIP\n3. Ikuti petunjuk instalasi\n4. Gunakan lisensi code: ${licenseCode}`,
          link_download: `https://download.arfcoder.com/${product.kategori}/${product.id}`
        })
        .select()
        .single();

      if (licenseError) {
        throw licenseError;
      }

      // Create notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          pesan: `Lisensi ${product.nama_produk} telah berhasil dibuat! Kode lisensi: ${licenseCode}`,
          tipe: 'success'
        });

      console.log(`License created for user ${user.id}, product ${product_id}`);

      return new Response(JSON.stringify({ 
        message: 'License created successfully',
        license
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    console.error('Error in licenses function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});