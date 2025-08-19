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
    // Get Tripay configuration
    const tripayPrivateKey = Deno.env.get("TRIPAY_PRIVATE_KEY");
    
    if (!tripayPrivateKey) {
      throw new Error("Tripay private key not configured");
    }

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get webhook data from Tripay
    const webhookData = await req.json();
    console.log("Tripay webhook received:", webhookData);

    // Verify signature from Tripay
    const receivedSignature = req.headers.get("X-Callback-Signature");
    const callbackEvent = req.headers.get("X-Callback-Event");
    
    if (!receivedSignature || !callbackEvent) {
      throw new Error("Missing required webhook headers");
    }

    // Calculate expected signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(tripayPrivateKey);
    const messageData = encoder.encode(JSON.stringify(webhookData));
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const signatureArray = new Uint8Array(signature);
    const expectedSignature = Array.from(signatureArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    if (receivedSignature !== expectedSignature) {
      console.error("Invalid signature from Tripay webhook");
      throw new Error("Invalid webhook signature");
    }

    // Process payment based on event type
    if (callbackEvent === "payment_status") {
      const { reference, merchant_ref, status } = webhookData;
      
      // Find order by Tripay reference
      const { data: orders, error: fetchError } = await supabaseClient
        .from("orders")
        .select("*")
        .eq("data_input->tripay_reference", reference)
        .single();

      if (fetchError || !orders) {
        console.error("Order not found for reference:", reference);
        return new Response(JSON.stringify({ 
          success: false,
          message: "Order not found" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      let paymentStatus = "pending";
      let notificationMessage = "";
      let notificationType = "info";

      // Map Tripay status to our system
      switch (status) {
        case "PAID":
          paymentStatus = "completed";
          notificationMessage = `Pembayaran berhasil untuk order ${merchant_ref}. Lisensi akan segera dikirim.`;
          notificationType = "success";
          break;
        case "EXPIRED":
          paymentStatus = "failed";
          notificationMessage = `Pembayaran untuk order ${merchant_ref} telah kedaluwarsa.`;
          notificationType = "error";
          break;
        case "FAILED":
          paymentStatus = "failed";
          notificationMessage = `Pembayaran untuk order ${merchant_ref} gagal.`;
          notificationType = "error";
          break;
        case "UNPAID":
        default:
          paymentStatus = "pending";
          notificationMessage = `Status pembayaran untuk order ${merchant_ref} masih pending.`;
          break;
      }

      // Update order status
      const { error: updateError } = await supabaseClient
        .from("orders")
        .update({
          payment_status: paymentStatus,
          status_bayar: paymentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orders.id);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        throw new Error("Failed to update order status");
      }

      // Create notification for user
      const { error: notificationError } = await supabaseClient
        .from("notifications")
        .insert({
          user_id: orders.user_id,
          pesan: notificationMessage,
          tipe: notificationType,
        });

      if (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }

      // If payment is successful, create license
      if (status === "PAID") {
        // Generate license code
        const licenseCode = `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        const { error: licenseError } = await supabaseClient
          .from("licenses")
          .insert({
            user_id: orders.user_id,
            product_id: orders.product_id,
            kode_lisensi: licenseCode,
            tutorial: "Tutorial akan dikirim melalui email dalam 24 jam.",
            link_download: "https://download.example.com", // Replace with actual download link
            aktif: true,
          });

        if (licenseError) {
          console.error("Failed to create license:", licenseError);
        } else {
          console.log(`License created: ${licenseCode} for user ${orders.user_id}`);
        }
      }

      console.log(`Order ${orders.id} updated to status: ${paymentStatus}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Webhook processed successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in tripay-webhook:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Webhook processing failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});