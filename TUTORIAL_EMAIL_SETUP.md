# Panduan Setup Email ArfCoder

## Overview
Sistem email ArfCoder menggunakan **Resend** sebagai layanan email provider. Kami memiliki 3 jenis email yang berbeda:

1. **OTP Email** - Untuk verifikasi email dan reset password
2. **Notification Email** - Untuk pemberitahuan registrasi, login, informasi umum
3. **Payment Confirmation Email** - Untuk konfirmasi checkout dan status pembayaran

## Setup Resend Account

### 1. Buat Akun Resend
1. Kunjungi https://resend.com
2. Daftar dengan email Anda
3. Verifikasi email yang dikirimkan

### 2. Verifikasi Domain Email (PENTING!)
Untuk dapat mengirim email dari domain sendiri (contoh: noreply@arfcoder.com), Anda perlu memverifikasi domain:

1. Login ke dashboard Resend: https://resend.com/domains
2. Klik "Add Domain"
3. Masukkan domain Anda (contoh: arfcoder.com)
4. Ikuti instruksi untuk menambahkan DNS records berikut ke domain provider Anda:

```
Type: TXT
Name: @
Value: resend._domainkey.<random-string>

Type: MX  
Name: @
Priority: 10
Value: feedback-smtp.resend.com
```

5. Tunggu verifikasi (biasanya 15 menit - 24 jam)

### 3. Buat API Key
1. Kunjungi: https://resend.com/api-keys
2. Klik "Create API Key"
3. Beri nama: "ArfCoder Production"
4. Pilih permission: "Full access" atau "Sending access"
5. Copy API key yang dihasilkan

### 4. Set API Key di Supabase
API key perlu ditambahkan ke Supabase Edge Function Secrets:

1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/uoricbcevlvbvynejrsp/settings/functions
2. Di bagian "Function Secrets", tambahkan:
   - Secret Name: `RESEND_API_KEY`
   - Secret Value: [API key dari Resend]

## Konfigurasi Email Functions

### Update Domain Email
Setelah domain terverifikasi, update domain email di semua function:

1. **File: `supabase/functions/send-otp/index.ts`** - Line 116
2. **File: `supabase/functions/send-notification/index.ts`** - Line 114  
3. **File: `supabase/functions/send-payment-confirmation/index.ts`** - Line 167

Ubah dari:
```typescript
from: "ArfCoder <noreply@arfcoder.com>", // Update this with your verified domain
```

Menjadi:
```typescript
from: "ArfCoder <noreply@yourdomain.com>", // Ganti dengan domain yang sudah diverifikasi
```

## Testing Email Functions

### 1. Test OTP Email
```javascript
const { data, error } = await supabase.functions.invoke('send-otp', {
  body: {
    email: 'test@example.com',
    purpose: 'email_verification' // atau 'password_reset'
  }
});
```

### 2. Test Notification Email
```javascript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    email: 'test@example.com',
    type: 'registration_success', // atau 'login_notification', 'general_info'
    userName: 'John Doe',
    additionalData: {
      dashboardUrl: 'https://yourapp.com/dashboard'
    }
  }
});
```

### 3. Test Payment Confirmation
```javascript
const { data, error } = await supabase.functions.invoke('send-payment-confirmation', {
  body: {
    email: 'test@example.com',
    type: 'checkout_confirmation', // atau 'payment_success', 'payment_failed'
    userName: 'John Doe',
    orderData: {
      orderId: 'ORD-001',
      total: 50000,
      paymentMethod: 'Bank Transfer',
      items: [
        {
          nama_produk: 'Website Template',
          quantity: 1,
          harga: 50000
        }
      ]
    }
  }
});
```

## Types of Emails

### OTP Emails
- `email_verification` - Kode OTP untuk verifikasi email
- `password_reset` - Kode OTP untuk reset password

### Notification Emails
- `registration_success` - Email selamat datang setelah registrasi berhasil
- `login_notification` - Notifikasi login baru terdeteksi
- `general_info` - Email informasi umum

### Payment Confirmation Emails
- `checkout_confirmation` - Konfirmasi setelah checkout (menunggu pembayaran)
- `payment_success` - Konfirmasi pembayaran berhasil
- `payment_failed` - Notifikasi pembayaran gagal

## Integration dengan Frontend

### Contoh Penggunaan di React Component

```typescript
import { supabase } from "@/integrations/supabase/client";

// Kirim OTP setelah registrasi
const sendRegistrationOTP = async (email: string) => {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: { email, purpose: 'email_verification' }
  });
  return { data, error };
};

// Kirim welcome email setelah verifikasi berhasil
const sendWelcomeEmail = async (email: string, userName: string) => {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: {
      email,
      type: 'registration_success',
      userName,
      additionalData: {
        dashboardUrl: window.location.origin + '/dashboard'
      }
    }
  });
  return { data, error };
};

// Kirim konfirmasi checkout
const sendCheckoutConfirmation = async (email: string, orderData: any) => {
  const { data, error } = await supabase.functions.invoke('send-payment-confirmation', {
    body: {
      email,
      type: 'checkout_confirmation',
      userName: orderData.userName,
      orderData
    }
  });
  return { data, error };
};
```

## Troubleshooting

### Email tidak terkirim
1. Pastikan API key Resend valid dan tidak expired
2. Pastikan domain sudah terverifikasi di Resend
3. Check logs di Supabase Edge Function untuk error details
4. Pastikan email format valid dan tidak masuk spam list

### Domain verification gagal
1. Pastikan DNS records sudah benar
2. Tunggu propagasi DNS (bisa sampai 24 jam)
3. Gunakan DNS checker online untuk memverifikasi records
4. Hubungi support domain provider jika masih bermasalah

### Rate limit exceeded
Resend memiliki rate limit:
- Free plan: 100 emails/hari
- Pro plan: 50,000 emails/bulan
- Upgrade plan jika diperlukan

## Production Checklist

- [ ] Domain email sudah diverifikasi di Resend
- [ ] API key sudah di-set di Supabase secrets
- [ ] Semua email functions sudah menggunakan domain yang benar
- [ ] Test semua jenis email berhasil terkirim
- [ ] Email tidak masuk ke folder spam
- [ ] Template email sudah sesuai branding
- [ ] Error handling sudah diimplementasi di frontend

## Support
- Resend Documentation: https://resend.com/docs
- Resend Support: https://resend.com/support
- Supabase Edge Functions: https://supabase.com/docs/guides/functions