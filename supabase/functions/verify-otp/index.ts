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
    // Create Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { otp_code, email, purpose = "email_verification" } = await req.json();
    
    if (!otp_code) {
      throw new Error("OTP code is required");
    }

    console.log(`Verifying OTP: ${otp_code} for email: ${email} purpose: ${purpose}`);

    // Find valid OTP code
    const { data: otpRecords, error: fetchError } = await supabaseClient
      .from('otp_codes')
      .select('*')
      .eq('kode', otp_code)
      .eq('used', false)
      .eq('purpose', purpose)
      .gte('expired_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!otpRecords || otpRecords.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid or expired OTP code"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const otpRecord = otpRecords[0];

    // Check if OTP is expired
    if (new Date(otpRecord.expired_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: "OTP code has expired"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Mark OTP as used
    const { error: updateError } = await supabaseClient
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    if (updateError) {
      throw new Error(`Failed to update OTP: ${updateError.message}`);
    }

    console.log(`OTP verified successfully for purpose: ${purpose}`);

    // Handle different purposes
    let responseData: any = {
      success: true,
      message: "OTP verified successfully",
      purpose: purpose
    };

    switch (purpose) {
      case "email_verification":
        // Update user's email verification status
        if (email) {
          // You can add logic here to mark email as verified in your users table
          responseData.message = "Email verified successfully";
          responseData.email_verified = true;
        }
        break;
      
      case "password_reset":
        // Generate a temporary token for password reset
        responseData.message = "OTP verified. You can now reset your password.";
        responseData.reset_token = `reset_${otpRecord.id}_${Date.now()}`;
        break;
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to verify OTP" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});