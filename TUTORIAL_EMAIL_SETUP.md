# Tutorial Setup Email dengan Resend

## ⚠️ PENTING: Email di Setup di Supabase, Bukan File!

Email dalam aplikasi ini menggunakan **Resend** dan **Supabase Secrets**. Semua konfigurasi dilakukan di dashboard, BUKAN di file project.

## 📧 3 Jenis Email yang Tersedia

### 1. **Email OTP (Verifikasi)**
- File: `supabase/functions/send-otp/index.ts`
- Fungsi: Mengirim kode OTP untuk verifikasi email
- Template: Kode verifikasi 6 digit

### 2. **Email Notifikasi**  
- File: `supabase/functions/send-notification/index.ts`
- Fungsi: Mengirim notifikasi umum (daftar berhasil, login baru, info, dll)
- Template: Notifikasi dengan icon dan pesan custom

### 3. **Email Konfirmasi Pembayaran**
- File: `supabase/functions/send-payment-confirmation/index.ts` 
- Fungsi: Mengirim konfirmasi checkout, status pembayaran
- Template: Detail produk, status pembayaran, instruksi

## 🚀 Langkah Setup

### Step 1: Buat Akun Resend
1. Kunjungi: https://resend.com
2. Daftar akun baru atau login
3. Verifikasi email Anda

### Step 2: Verifikasi Domain (WAJIB!)
1. Masuk ke: https://resend.com/domains
2. Klik "Add Domain"
3. Masukkan domain Anda (contoh: `arfcoder.com`)
4. Ikuti instruksi DNS setup:
   - Tambah TXT record ke DNS provider
   - Tunggu verifikasi (bisa 1-24 jam)
5. **Status harus "Verified" sebelum bisa kirim email!**

### Step 3: Buat API Key  
1. Masuk ke: https://resend.com/api-keys
2. Klik "Create API Key"
3. Berikan nama: `ArfCoder App` 
4. **Salin API key dengan aman**

### Step 4: Setup di Supabase (INI YANG PENTING!)
1. Buka: https://supabase.com/dashboard/project/uoricbcevlvbvynejrsp/settings/functions
2. Scroll ke bagian "Secrets"
3. Tambahkan secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: [API key dari Resend yang sudah disalin]
4. Klik "Add secret"

## 📧 Mengubah Email Pengirim

Edit file edge function dan ganti bagian `from:`:

```typescript
// Ganti ini di file edge function:
from: "ArfCoder <noreply@yourdomain.com>", // Gunakan domain yang sudah diverifikasi
```

## 🔧 Troubleshooting

### ❌ Error: "Domain not verified"
- **Solusi**: Verifikasi domain di Resend dulu
- Check: https://resend.com/domains

### ❌ Error: "Invalid API key"  
- **Solusi**: API key salah di Supabase Secrets
- Generate ulang di Resend kalau perlu

### ❌ Error: "From address not allowed"
- **Solusi**: Pakai email dari domain yang sudah diverifikasi
- Format: `noreply@yourdomain.com`

### ❌ Email tidak terkirim
1. Check logs Resend: https://resend.com/logs
2. Check logs Supabase Function
3. Pastikan email penerima valid

## 💡 Tips Penting

1. **Jangan edit file .env** - Semua setting di Supabase Secrets
2. **Domain WAJIB diverifikasi** - Tidak bisa kirim email tanpa ini
3. **Test dulu** di development sebelum production
4. **Monitor usage** untuk avoid limit Resend

## 🔗 Links yang Dibutuhkan

- [Resend Dashboard](https://resend.com/dashboard)
- [Supabase Function Secrets](https://supabase.com/dashboard/project/uoricbcevlvbvynejrsp/settings/functions)
- [Supabase Functions](https://supabase.com/dashboard/project/uoricbcevlvbvynejrsp/functions)
- [Function Logs](https://supabase.com/dashboard/project/uoricbcevlvbvynejrsp/functions)

## 📝 Cara Test Email

1. Login ke aplikasi
2. Coba fitur yang trigger email (register, checkout, dll)
3. Check inbox email penerima
4. Kalau tidak masuk, check spam folder
5. Check logs di Supabase dan Resend