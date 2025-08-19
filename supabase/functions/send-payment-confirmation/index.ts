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

    const { 
      email, 
      type,
      userName = "",
      orderData = {}
    } = await req.json();
    
    if (!email || !type) {
      throw new Error("Email and type are required");
    }

    console.log(`Sending payment email to: ${email} for type: ${type}`);

    let subject = "";
    let htmlContent = "";

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(amount);
    };

    switch (type) {
      case "checkout_confirmation":
        subject = `Konfirmasi Checkout - Order #${orderData.orderId || 'Unknown'}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Konfirmasi Checkout</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #2563eb;">Terima kasih, ${userName}!</h2>
              <p>Checkout Anda telah berhasil diproses. Berikut detail pesanan Anda:</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="color: #1f2937; margin-top: 0;">Detail Pesanan</h3>
                <p><strong>Order ID:</strong> #${orderData.orderId || 'Unknown'}</p>
                <p><strong>Tanggal:</strong> ${new Date().toLocaleString('id-ID')}</p>
                <p><strong>Status:</strong> <span style="background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Menunggu Pembayaran</span></p>
              </div>
              
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="background: #f8fafc; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                  <h3 style="margin: 0; color: #1f2937;">Produk yang Dibeli</h3>
                </div>
                <div style="padding: 15px;">
                  ${orderData.items ? orderData.items.map((item: any) => `
                    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                      <div>
                        <p style="margin: 0; font-weight: bold; color: #1f2937;">${item.nama_produk || 'Produk'}</p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity || 1}</p>
                      </div>
                      <div style="text-align: right;">
                        <p style="margin: 0; font-weight: bold; color: #1f2937;">${formatCurrency(item.harga * (item.quantity || 1))}</p>
                      </div>
                    </div>
                  `).join('') : '<p>Tidak ada produk</p>'}
                  
                  <div style="padding-top: 15px; margin-top: 15px; border-top: 2px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                      <span>Total:</span>
                      <span style="color: #2563eb;">${formatCurrency(orderData.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #92400e; margin-top: 0;">Informasi Pembayaran</h4>
                <p style="color: #92400e; margin: 5px 0;">Metode: ${orderData.paymentMethod || 'Tidak diketahui'}</p>
                <p style="color: #92400e; margin: 5px 0;">Silakan lakukan pembayaran sesuai instruksi yang diberikan.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderData.paymentUrl || '#'}" 
                   style="background: #2563eb; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                   Lakukan Pembayaran
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Jika Anda memiliki pertanyaan tentang pesanan ini, silakan hubungi customer service kami.
              </p>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">ArfCoder Creative Hub © 2024</p>
            </div>
          </div>
        `;
        break;

      case "payment_success":
        subject = `Pembayaran Berhasil - Order #${orderData.orderId || 'Unknown'}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Pembayaran Berhasil!</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #10b981;">Terima kasih, ${userName}!</h2>
              <p>Pembayaran Anda telah berhasil diverifikasi. Pesanan Anda sedang diproses.</p>
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <h3 style="color: #166534; margin-top: 0;">Detail Pembayaran</h3>
                <p><strong>Order ID:</strong> #${orderData.orderId || 'Unknown'}</p>
                <p><strong>Total Dibayar:</strong> ${formatCurrency(orderData.total || 0)}</p>
                <p><strong>Metode Pembayaran:</strong> ${orderData.paymentMethod || 'Tidak diketahui'}</p>
                <p><strong>Status:</strong> <span style="background: #10b981; color: #ffffff; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Dibayar</span></p>
              </div>
              
              <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1d4ed8; margin-top: 0;">Langkah Selanjutnya</h4>
                <p style="color: #1e40af; margin: 5px 0;">1. Lisensi produk akan dikirimkan ke email Anda dalam 5-10 menit</p>
                <p style="color: #1e40af; margin: 5px 0;">2. Anda dapat mengunduh produk dari dashboard</p>
                <p style="color: #1e40af; margin: 5px 0;">3. Simpan kode lisensi untuk keperluan aktivasi</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderData.dashboardUrl || '#'}" 
                   style="background: #2563eb; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                   Lihat Dashboard
                </a>
              </div>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">ArfCoder Creative Hub © 2024</p>
            </div>
          </div>
        `;
        break;

      case "payment_failed":
        subject = `Pembayaran Gagal - Order #${orderData.orderId || 'Unknown'}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #dc2626; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">❌ Pembayaran Gagal</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #dc2626;">Maaf, ${userName}</h2>
              <p>Pembayaran untuk pesanan Anda tidak berhasil diproses.</p>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                <h3 style="color: #991b1b; margin-top: 0;">Detail Pesanan</h3>
                <p><strong>Order ID:</strong> #${orderData.orderId || 'Unknown'}</p>
                <p><strong>Total:</strong> ${formatCurrency(orderData.total || 0)}</p>
                <p><strong>Alasan:</strong> ${orderData.failureReason || 'Tidak diketahui'}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${orderData.retryUrl || '#'}" 
                   style="background: #dc2626; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                   Coba Lagi
                </a>
              </div>
            </div>
            
            <hr>
            <p style="color: #6b7280; font-size: 12px;">ArfCoder Creative Hub</p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown payment email type: ${type}`);
    }

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: "ArfCoder <noreply@arfcoder.com>", // Update with your verified domain
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Payment email sent successfully:", emailResult);

    return new Response(JSON.stringify({
      success: true,
      message: "Payment email sent successfully",
      email_id: emailResult.data?.id || "unknown"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error sending payment email:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to send payment email" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});