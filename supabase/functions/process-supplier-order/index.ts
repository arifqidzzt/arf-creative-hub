import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { orderId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Get active supplier
    const { data: supplier, error: supplierError } = await supabaseClient
      .from('supplier_configs')
      .select('*')
      .eq('is_active', true)
      .single();

    if (supplierError) throw supplierError;

    // Mock API call to supplier
    const supplierResponse = await fetch(supplier.api_url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supplier.api_key_encrypted}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: order.product_id,
        data_input: order.data_input,
        amount: order.total
      })
    });

    const result = await supplierResponse.json();

    // Log transaction
    await supabaseClient.from('transaction_logs').insert({
      order_id: orderId,
      supplier_id: supplier.id,
      status: result.success ? 'success' : 'failed',
      supplier_response: result,
      balance_before: supplier.balance,
      balance_after: supplier.balance - order.total,
      cost_amount: order.total
    });

    // Update order
    await supabaseClient.from('orders').update({
      supplier_status: result.success ? 'success' : 'failed',
      supplier_order_id: result.order_id,
      processed_at: new Date().toISOString()
    }).eq('id', orderId);

    // Update supplier balance
    await supabaseClient.from('supplier_configs').update({
      balance: supplier.balance - order.total
    }).eq('id', supplier.id);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error processing supplier order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});