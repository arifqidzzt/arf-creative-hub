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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const url = new URL(req.url);
    const method = req.method;

    if (method === 'GET') {
      // Get all active products
      const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('aktif', true)
        .order('kategori', { ascending: true });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (method === 'POST') {
      const { product_id, user_id } = await req.json();

      // Get product details
      const { data: product, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', product_id)
        .eq('aktif', true)
        .single();

      if (productError || !product) {
        return new Response(JSON.stringify({ error: 'Product not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      if (product.stok <= 0) {
        return new Response(JSON.stringify({ error: 'Product out of stock' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Create order (simplified - real implementation would include payment processing)
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          user_id,
          product_id,
          jumlah: 1,
          total: product.harga,
          status_bayar: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create license automatically after successful purchase
      const { error: licenseError } = await supabaseClient.functions.invoke('licenses', {
        body: { 
          product_id: product_id, 
          order_id: order.id 
        }
      });

      if (licenseError) {
        console.error('Error creating license:', licenseError);
      }

      console.log('Order created:', order);

      return new Response(JSON.stringify({ 
        message: 'Order created successfully', 
        order_id: order.id,
        total: product.harga 
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
    console.error('Error in products function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});