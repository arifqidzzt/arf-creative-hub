# 🚀 Tutorial Payment Gateway Integration - ArfCoder

## 📋 Overview
Panduan lengkap untuk setup dan konfigurasi payment gateway menggunakan Stripe untuk sistem checkout ArfCoder.

## 🔧 Prerequisites

### 1. Akun Stripe
- Buat akun di [https://stripe.com](https://stripe.com)
- Verifikasi email dan lengkapi profil business
- Dapatkan API keys dari dashboard

### 2. Resend Email Service
- Buat akun di [https://resend.com](https://resend.com)
- Verifikasi domain email (required untuk production)
- Dapatkan API key untuk email sending

## 🔑 API Keys Setup

### Stripe Configuration
1. **Login ke Stripe Dashboard**: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Buka API Keys**: Dashboard > Developers > API Keys
3. **Copy Secret Key**: `sk_test_...` (test) atau `sk_live_...` (live)
4. **Test Mode vs Live Mode**: 
   - Test: `sk_test_...` - untuk development
   - Live: `sk_live_...` - untuk production

### Resend Configuration  
1. **Login ke Resend**: [https://resend.com](https://resend.com)
2. **Create API Key**: Settings > API Keys > Create
3. **Domain Verification**: 
   - Add your domain: `yourdomain.com`
   - Add DNS records (TXT, CNAME)
   - Verify domain status

## 🚨 Important Notes

### API Key Security
- ✅ **SUDAH ADA**: API keys disimpan dengan aman di Supabase Secrets
- ✅ **SUDAH ADA**: Edge Functions menggunakan environment variables
- ❌ **JANGAN**: Menyimpan API keys di frontend code
- ❌ **JANGAN**: Commit API keys ke repository

### Current Implementation Status
```
✅ Database tables: subscribers, cart_items, orders (with payment tracking)
✅ Edge Functions: create-checkout, verify-payment, send-otp, verify-otp  
✅ Frontend pages: Checkout, PaymentSuccess, EmailVerification
✅ API Integration: Stripe Checkout, Payment verification, Email OTP
✅ Security: RLS policies, Service role authentication
```

## 🛠️ Configuration Steps

### Step 1: Update Stripe Settings (REQUIRED)
1. **Currency**: Currently set to `IDR` (Indonesian Rupiah)
   - Ubah di `supabase/functions/create-checkout/index.ts` line 58
   - Ganti `currency: "idr"` dengan currency yang diinginkan

2. **Payment Methods**: 
   - Default: Semua metode yang didukung Stripe
   - Custom: Edit di checkout session configuration

3. **Email Domain untuk Resend**:
   - Edit `supabase/functions/send-otp/index.ts` line 68
   - Ganti `from: "ArfCoder <noreply@arfcoder.com>"` 
   - Dengan domain yang sudah diverifikasi

### Step 2: Test Payment Flow
```bash
# Test mode products (Stripe)
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any valid postal code
```

### Step 3: Webhook Configuration (OPTIONAL)
Jika ingin menggunakan webhooks untuk real-time payment updates:

1. **Buat Webhook Endpoint di Stripe Dashboard**
2. **URL**: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. **Events**: 
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 📁 File Structure
```
supabase/functions/
├── create-checkout/index.ts     # Membuat Stripe checkout session
├── verify-payment/index.ts      # Verifikasi status pembayaran
├── send-otp/index.ts           # Kirim OTP email
└── verify-otp/index.ts         # Verifikasi OTP code

src/pages/
├── Checkout.tsx                # Halaman checkout
├── PaymentSuccess.tsx          # Halaman sukses pembayaran  
└── EmailVerification.tsx       # Halaman verifikasi email
```

## 🔄 Payment Flow

### 1. Customer Journey
```
Products Page → Add to Cart → Checkout Page → Stripe Payment → Success Page → Auto License Creation
```

### 2. Backend Process
```
Frontend Request → Edge Function → Stripe API → Database Update → Email Notification → License Generation
```

## 🧪 Testing Checklist

### Frontend Testing
- [ ] Add products to cart
- [ ] View cart in checkout page
- [ ] Update quantities
- [ ] Remove items
- [ ] Process checkout (creates Stripe session)
- [ ] Redirect to Stripe
- [ ] Return to success page
- [ ] Verify payment status

### Backend Testing
- [ ] Checkout session creation
- [ ] Payment verification
- [ ] Database updates
- [ ] Email OTP sending
- [ ] OTP verification
- [ ] License auto-generation

### Email Testing
- [ ] OTP email delivery
- [ ] Email formatting
- [ ] Domain reputation
- [ ] Spam folder check

## 🚀 Production Checklist

### Before Go-Live
- [ ] Switch to Stripe Live mode
- [ ] Update live API keys in Supabase Secrets
- [ ] Verify domain for Resend
- [ ] Test with real payment methods
- [ ] Configure proper error handling
- [ ] Set up monitoring and alerts

### Security Review
- [ ] All API keys in secure storage
- [ ] RLS policies properly configured
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] CORS properly set

## 💡 Customization Options

### 1. Payment Methods
Edit dalam `create-checkout` function untuk menambah/mengatur payment methods:
```typescript
payment_method_types: ['card', 'fpx', 'grabpay', 'alipay'], // Malaysia
// atau
payment_method_types: ['card', 'dana', 'ovo', 'gopay'], // Indonesia (bila tersedia)
```

### 2. Currency & Localization
Ubah currency dan format harga sesuai negara target:
```typescript
currency: "usd", // atau "myr", "sgd", dll
```

### 3. Email Templates
Customize email templates di `send-otp` function untuk branding yang sesuai.

## 📞 Support & Troubleshooting

### Common Issues
1. **Payment Failed**: Check Stripe logs
2. **Email Not Received**: Check domain verification
3. **OTP Expired**: Default 15 minutes, adjust in code
4. **License Not Created**: Check database logs

### Debug Mode
Enable debug logging di edge functions untuk troubleshooting:
```typescript
console.log("Debug info:", data);
```

---
**Created by**: ArfCoder Development Team  
**Last Updated**: 2025-08-19  
**Version**: 1.0.0