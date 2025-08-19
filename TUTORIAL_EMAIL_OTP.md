# 📧 Tutorial Email OTP Verification - ArfCoder

## 📋 Overview
Panduan lengkap implementasi sistem verifikasi email menggunakan OTP (One-Time Password) dengan Resend email service.

## 🔧 System Architecture

### Database Schema
```sql
-- OTP codes table
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kode TEXT NOT NULL,                    -- 6-digit OTP code
  expired_at TIMESTAMP WITH TIME ZONE NOT NULL,  -- 15 minutes expiry
  used BOOLEAN DEFAULT false,            -- Prevention of reuse
  purpose TEXT DEFAULT 'email_verification',     -- Multiple use cases
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Edge Functions
1. **send-otp**: Generates and sends OTP via email
2. **verify-otp**: Validates OTP code and marks as used

## 🚀 Implementation Guide

### Step 1: Resend Setup (REQUIRED)

#### A. Create Account
1. Visit [https://resend.com](https://resend.com)
2. Sign up with your email
3. Verify your account

#### B. Domain Verification (PRODUCTION REQUIRED)
1. **Add Domain**: Go to Domains > Add Domain
2. **DNS Configuration**: Add these records to your domain:
   ```
   Type: TXT
   Name: @
   Value: resend-verify=your_verification_code
   
   Type: CNAME  
   Name: resend._domainkey
   Value: resend._domainkey.yourdomain.com
   ```
3. **Verify**: Wait for DNS propagation (up to 24 hours)
4. **Status**: Domain should show "Verified" status

#### C. API Key Creation
1. **Settings > API Keys**
2. **Create API Key** with appropriate permissions
3. **Copy key**: Format `re_...`

### Step 2: Email Configuration

#### Current Implementation
```typescript
// In supabase/functions/send-otp/index.ts
from: "ArfCoder <noreply@arfcoder.com>"  // Line 68 - CHANGE THIS
```

#### Required Changes
**IMPORTANT**: Update email sender to your verified domain:
```typescript
// For development (works with any domain)
from: "ArfCoder <onboarding@resend.dev>"

// For production (must use verified domain)  
from: "ArfCoder <noreply@yourdomain.com>"
```

### Step 3: OTP Configuration

#### Security Settings
```typescript
// Current settings (can be customized)
const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
const expiryTime = new Date();
expiryTime.setMinutes(expiryTime.getMinutes() + 15); // 15 minutes
```

#### Customization Options
- **OTP Length**: Change `100000 + Math.random() * 900000` for different lengths
- **Expiry Time**: Modify `15` to desired minutes
- **Character Set**: Currently numbers only, can add letters

## 📧 Email Templates

### Built-in Templates

#### 1. Email Verification
```html
Subject: Verifikasi Email ArfCoder - Kode OTP
Content: Clean template with blue theme
Use case: Account email verification
```

#### 2. Password Reset  
```html
Subject: Reset Password ArfCoder - Kode OTP  
Content: Red warning theme for security
Use case: Password reset requests
```

#### 3. Generic Verification
```html
Subject: Kode Verifikasi ArfCoder
Content: Default template for other purposes
Use case: Multi-purpose OTP needs
```

### Template Customization
Edit templates in `send-otp/index.ts` starting from line 47:

```typescript
// Add new template
case "login_verification":
  subject = "Login Verification - ArfCoder";
  htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Login Verification</h2>
      <p>Your login verification code:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${otpCode}</h1>
      </div>
      <p>This code expires in 15 minutes.</p>
    </div>
  `;
  break;
```

## 🔐 Security Features

### Prevention Mechanisms
1. **Single Use**: OTP marked as `used` after verification
2. **Time Limit**: 15-minute expiry window
3. **Purpose Isolation**: Different OTPs for different purposes
4. **Rate Limiting**: Built into Supabase Edge Functions

### Database Security
```sql
-- RLS Policies already implemented
CREATE POLICY "Users can view their own OTP codes" ON public.otp_codes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all OTP codes" ON public.otp_codes  
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));
```

## 🧪 Testing Guide

### Development Testing

#### 1. Send OTP Test
```javascript
// Test API call
const { data, error } = await supabase.functions.invoke('send-otp', {
  body: { 
    email: "test@example.com",
    purpose: 'email_verification'
  }
});
```

#### 2. Verify OTP Test  
```javascript
// Test verification
const { data, error } = await supabase.functions.invoke('verify-otp', {
  body: {
    otp_code: "123456",
    email: "test@example.com", 
    purpose: 'email_verification'
  }
});
```

### Production Testing Checklist
- [ ] Domain verification status
- [ ] Email delivery to inbox (not spam)
- [ ] OTP code generation and uniqueness
- [ ] Expiry time functionality
- [ ] Single-use prevention
- [ ] Error handling and user feedback
- [ ] Email formatting and branding

## 🎨 Frontend Integration

### Usage Examples

#### Basic Email Verification
```typescript
// Send OTP
const sendOTP = async (email: string) => {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: { email, purpose: 'email_verification' }
  });
  
  if (error) {
    // Handle error
    console.error('Failed to send OTP:', error);
    return;
  }
  
  // Show success message
  alert('OTP sent to your email!');
};

// Verify OTP  
const verifyOTP = async (otpCode: string, email: string) => {
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: { 
      otp_code: otpCode,
      email,
      purpose: 'email_verification' 
    }
  });
  
  if (data.success) {
    // Handle success
    alert('Email verified successfully!');
  } else {
    // Handle failure
    alert('Invalid OTP code');
  }
};
```

### UI Components
Current implementation includes:
- **EmailVerification.tsx**: Complete verification flow
- **Form validation**: Input sanitization and validation
- **Error handling**: User-friendly error messages
- **Loading states**: Proper UX during API calls

## 🚨 Troubleshooting

### Common Issues

#### 1. Email Not Delivered
**Causes**:
- Domain not verified (production)
- Sender reputation issues
- Spam filters

**Solutions**:
- Verify domain properly
- Use resend.dev domain for testing
- Check Resend dashboard for delivery logs

#### 2. OTP Verification Failed
**Causes**:
- Code expired (>15 minutes)
- Code already used
- Wrong purpose parameter
- Database connection issues

**Solutions**:
- Check timestamp comparison
- Verify `used` flag in database
- Ensure purpose matches
- Check Supabase logs

#### 3. Database Permission Errors
**Causes**:
- RLS policy restrictions
- Missing authentication
- Service role key issues

**Solutions**:
- Use service role key for edge functions
- Check RLS policies
- Verify user authentication

### Debug Mode
Enable detailed logging:
```typescript
// Add to edge functions
console.log('OTP Details:', {
  code: otpCode,
  email: email,
  purpose: purpose,
  expiryTime: expiryTime
});
```

## 📊 Analytics & Monitoring

### Key Metrics to Track
- OTP delivery success rate
- Verification success rate  
- Average time to verify
- Failed verification reasons
- Email bounce rates

### Monitoring Setup
1. **Resend Dashboard**: Monitor email delivery
2. **Supabase Logs**: Track edge function performance  
3. **Database Metrics**: Query performance and errors

## 🔄 Multiple Use Cases

### Supported Purposes
1. `email_verification` - Account verification
2. `password_reset` - Password recovery
3. `login_verification` - Two-factor auth
4. Custom purposes as needed

### Adding New Purpose
```typescript
// In send-otp function, add new case
case "two_factor_auth":
  subject = "Two-Factor Authentication - ArfCoder";
  htmlContent = `...custom template...`;
  break;
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] Domain verified in Resend
- [ ] API key updated to production key
- [ ] Email templates reviewed and branded
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Security policies reviewed

### Performance Optimization
- [ ] Email template optimization
- [ ] Database query optimization
- [ ] Edge function cold start minimization
- [ ] Proper error caching

---
**Created by**: ArfCoder Development Team  
**Last Updated**: 2025-08-19  
**Version**: 1.0.0