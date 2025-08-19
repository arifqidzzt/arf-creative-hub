import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
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
    // Initialize Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not configured. Please add it in Supabase Edge Function Secrets.");
    }
    
    const resend = new Resend(resendKey);

    // Create Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { email, purpose = "email_verification" } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Sending OTP to email: ${email} for purpose: ${purpose}`);

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry time (15 minutes from now)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 15);

    // Save OTP to database
    const { error: otpError } = await supabaseClient
      .from('otp_codes')
      .insert({
        user_id: null, // Will be updated when user is identified
        kode: otpCode,
        expired_at: expiryTime.toISOString(),
        purpose: purpose,
        used: false
      });

    if (otpError) {
      throw new Error(`Failed to save OTP: ${otpError.message}`);
    }

    // Email templates based on purpose
    let subject = "";
    let htmlContent = "";

    switch (purpose) {
      case "email_verification":
        subject = "Verifikasi Email ArfCoder - Kode OTP";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Verifikasi Email ArfCoder</h2>
            <p>Gunakan kode OTP berikut untuk memverifikasi email Anda:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
            </div>
            <p>Kode ini akan kedaluwarsa dalam 15 menit.</p>
            <p>Jika Anda tidak meminta verifikasi ini, abaikan email ini.</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">ArfCoder Creative Hub</p>
          </div>
        `;
        break;
      case "password_reset":
        subject = "Reset Password ArfCoder - Kode OTP";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Reset Password ArfCoder</h2>
            <p>Gunakan kode OTP berikut untuk reset password Anda:</p>
            <div style="background: #fef2f2; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #fecaca;">
              <h1 style="color: #991b1b; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
            </div>
            <p>Kode ini akan kedaluwarsa dalam 15 menit.</p>
            <p style="color: #dc2626;"><strong>Jika Anda tidak meminta reset password, segera hubungi kami!</strong></p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">ArfCoder Creative Hub</p>
          </div>
        `;
        break;
      default:
        subject = "Kode Verifikasi ArfCoder";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Kode Verifikasi</h2>
            <p>Kode verifikasi Anda:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
            </div>
            <p>Kode ini akan kedaluwarsa dalam 15 menit.</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">ArfCoder Creative Hub</p>
          </div>
        `;
    }

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: "ArfCoder <noreply@arfcoder.com>", // Update this with your verified domain
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: "OTP sent successfully",
      otp_id: emailResult.data?.id || "unknown",
      expires_at: expiryTime.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to send OTP" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});