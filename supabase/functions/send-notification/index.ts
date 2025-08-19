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
      throw new Error("RESEND_API_KEY is not configured.");
    }
    
    const resend = new Resend(resendKey);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { 
      email, 
      type, 
      userName = "", 
      additionalData = {} 
    } = await req.json();
    
    if (!email || !type) {
      throw new Error("Email and type are required");
    }

    console.log(`Sending notification email to: ${email} for type: ${type}`);

    let subject = "";
    let htmlContent = "";

    switch (type) {
      case "registration_success":
        subject = "Selamat Datang di ArfCoder!";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Selamat Datang!</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #2563eb;">Halo ${userName}!</h2>
              <p>Terima kasih telah bergabung dengan ArfCoder Creative Hub. Akun Anda telah berhasil dibuat dan diverifikasi.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1f2937; margin-top: 0;">Apa yang bisa Anda lakukan sekarang:</h3>
                <ul style="color: #374151;">
                  <li>Jelajahi produk digital terbaru kami</li>
                  <li>Dapatkan lisensi untuk proyek Anda</li>
                  <li>Akses tutorial dan dokumentasi</li>
                  <li>Bergabung dengan komunitas developer</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${additionalData.dashboardUrl || '#'}" 
                   style="background: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                   Mulai Jelajahi
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi tim support kami.
              </p>
            </div>
            <div style="background: #f1f5f9; padding: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">ArfCoder Creative Hub © 2024</p>
            </div>
          </div>
        `;
        break;

      case "login_notification":
        subject = "Login Baru Terdeteksi - ArfCoder";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Login Baru Terdeteksi</h2>
            <p>Halo ${userName},</p>
            <p>Kami mendeteksi login baru ke akun ArfCoder Anda:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Waktu:</strong> ${new Date().toLocaleString('id-ID')}</p>
              <p style="margin: 5px 0;"><strong>IP Address:</strong> ${additionalData.ipAddress || 'Tidak diketahui'}</p>
              <p style="margin: 5px 0;"><strong>Device:</strong> ${additionalData.device || 'Tidak diketahui'}</p>
            </div>
            
            <p>Jika ini bukan Anda, segera ubah password akun Anda dan hubungi support kami.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${additionalData.securityUrl || '#'}" 
                 style="background: #dc2626; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                 Ubah Password
              </a>
            </div>
            
            <hr>
            <p style="color: #6b7280; font-size: 12px;">ArfCoder Creative Hub</p>
          </div>
        `;
        break;

      case "general_info":
        subject = additionalData.subject || "Informasi dari ArfCoder";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">${additionalData.title || 'Informasi'}</h2>
            <p>Halo ${userName},</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${additionalData.content || 'Tidak ada konten.'}
            </div>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">ArfCoder Creative Hub</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: "ArfCoder <noreply@arfcoder.com>", // Update with your verified domain
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Notification email sent successfully:", emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: "Notification email sent successfully",
      email_id: emailResult.data?.id || "unknown"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to send notification email" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});