import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Tripay configuration from secrets
    const tripayApiKey = Deno.env.get("TRIPAY_API_KEY");
    const tripayPrivateKey = Deno.env.get("TRIPAY_PRIVATE_KEY");
    const tripayMerchantCode = Deno.env.get("TRIPAY_MERCHANT_CODE");
    const tripayMode = Deno.env.get("TRIPAY_MODE") || "sandbox"; // sandbox or production
    
    if (!tripayApiKey || !tripayPrivateKey || !tripayMerchantCode) {
      throw new Error("Tripay credentials not configured. Please add TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, and TRIPAY_MERCHANT_CODE in Supabase Edge Function Secrets.");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    console.log(`Creating Tripay payment for user: ${user.email}`);

    // Get request data
    const { items, payment_method = "BRIVA" } = await req.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Items array is required");
    }

    // Calculate total amount
    const amount = items.reduce((total: number, item: any) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);

    // Generate merchant reference (unique order ID)
    const merchantRef = `ORDER-${Date.now()}-${user.id.slice(0, 8)}`;

    // Prepare Tripay request data
    const tripayData = {
      method: payment_method, // Payment method code (BRIVA, MANDIRI, BCA, etc.)
      merchant_ref: merchantRef,
      amount: amount,
      customer_name: user.email.split('@')[0], // Use email username as customer name
      customer_email: user.email,
      customer_phone: "08123456789", // You might want to collect this from user profile
      order_items: items.map((item: any) => ({
        sku: item.id || `ITEM-${Date.now()}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      })),
      return_url: `${req.headers.get("origin")}/payment-success`,
      expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      signature: "", // Will be calculated below
    };

    // Create signature for Tripay
    const signatureData = `${tripayMerchantCode}${merchantRef}${amount}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(tripayPrivateKey);
    const messageData = encoder.encode(signatureData);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureArray = new Uint8Array(signature);
    tripayData.signature = Array.from(signatureArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    // Tripay API endpoint
    const tripayBaseUrl = tripayMode === "production" 
      ? "https://tripay.co.id/api"
      : "https://tripay.co.id/api-sandbox";

    // Call Tripay API to create transaction
    const tripayResponse = await fetch(`${tripayBaseUrl}/transaction/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tripayApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tripayData),
    });

    const tripayResult = await tripayResponse.json();

    if (!tripayResponse.ok || !tripayResult.success) {
      console.error("Tripay API Error:", tripayResult);
      throw new Error(tripayResult.message || "Failed to create Tripay transaction");
    }

    const transactionData = tripayResult.data;

    // Save order to database
    const { error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        user_id: user.id,
        product_id: items[0]?.id, // Use first item's ID
        total: amount,
        jumlah: items.reduce((total: number, item: any) => total + (item.quantity || 1), 0),
        metode_bayar: payment_method,
        payment_status: "pending",
        data_input: {
          tripay_reference: transactionData.reference,
          tripay_merchant_ref: merchantRef,
          tripay_payment_url: transactionData.checkout_url,
          items: items,
        },
      });

    if (orderError) {
      console.error("Database error:", orderError);
      throw new Error("Failed to save order to database");
    }

    console.log(`Tripay transaction created: ${transactionData.reference}`);

    return new Response(JSON.stringify({ 
      success: true,
      payment_url: transactionData.checkout_url,
      reference: transactionData.reference,
      merchant_ref: merchantRef,
      amount: amount,
      payment_method: payment_method,
      expired_time: transactionData.expired_time,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in tripay-create-payment:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "An error occurred creating Tripay payment" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});