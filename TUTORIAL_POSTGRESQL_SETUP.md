# Tutorial Setup PostgreSQL dari Awal sampai Akhir

## 1. Persiapan Awal

### Prerequisites
- Node.js (versi 18+)
- Git
- Text Editor (VS Code recommended)
- Akun Supabase (gratis)

## 2. Setup Supabase Project

### Langkah 1: Buat Project Supabase
1. Kunjungi [supabase.com](https://supabase.com)
2. Sign up atau Login
3. Klik "New Project"
4. Isi detail project:
   - **Name**: Nama project Anda
   - **Organization**: Pilih atau buat baru
   - **Database Password**: Buat password yang kuat
   - **Region**: Pilih yang terdekat (Southeast Asia - Singapore)
5. Klik "Create new project"
6. Tunggu beberapa menit sampai project siap

### Langkah 2: Dapatkan Kredential
Setelah project siap, di dashboard Supabase:
1. Masuk ke **Settings** → **API**
2. Catat informasi berikut:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Project ID**: [project-id]
   - **Anon Key**: `eyJ...` (public key)
   - **Service Role Key**: `eyJ...` (private key)

## 3. Setup Database Schema

### Langkah 1: Buat Tabel Users (Profiles)
Masuk ke **SQL Editor** di dashboard Supabase dan jalankan:

```sql
-- Buat tabel profiles untuk data user tambahan
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies untuk profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);
```

### Langkah 2: Buat Trigger Auto-Profile
```sql
-- Function untuk auto-create profile saat user daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nama)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', new.email));
  RETURN new;
END;
$$;

-- Trigger yang menjalankan function di atas
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Langkah 3: Buat Tabel Products
```sql
-- Tabel produk
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_produk TEXT NOT NULL,
  deskripsi TEXT,
  harga INTEGER NOT NULL,
  kategori TEXT NOT NULL,
  stok INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa lihat produk aktif
CREATE POLICY "Anyone can view active products" 
ON public.products FOR SELECT 
USING (aktif = true);
```

### Langkah 4: Buat Tabel Shopping Cart
```sql
-- Tabel keranjang belanja
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa kelola cart sendiri
CREATE POLICY "Users can manage own cart" 
ON public.cart_items FOR ALL 
USING (user_id = auth.uid());
```

### Langkah 5: Buat Tabel Orders
```sql
-- Tabel pesanan
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  jumlah INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL,
  status_bayar TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  metode_bayar TEXT,
  stripe_session_id TEXT,
  data_input JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies untuk orders
CREATE POLICY "Users can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

### Langkah 6: Buat Tabel OTP Codes
```sql
-- Tabel kode OTP
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kode TEXT NOT NULL,
  purpose TEXT DEFAULT 'email_verification',
  expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa lihat OTP sendiri
CREATE POLICY "Users can view their own OTP codes" 
ON public.otp_codes FOR SELECT 
USING (auth.uid() = user_id);
```

### Langkah 7: Buat Tabel Licenses
```sql
-- Tabel lisensi produk
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  kode_lisensi TEXT,
  tutorial TEXT,
  link_download TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Policy: User bisa lihat lisensi sendiri
CREATE POLICY "Users can view their own licenses" 
ON public.licenses FOR SELECT 
USING (auth.uid() = user_id);
```

### Langkah 8: Buat Tabel Notifications
```sql
-- Tabel notifikasi
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pesan TEXT NOT NULL,
  tipe TEXT DEFAULT 'info',
  status_baca BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies untuk notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);
```

### Langkah 9: Buat Function Update Timestamp
```sql
-- Function untuk auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update timestamp di semua tabel
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## 4. Test Database

### Langkah 1: Insert Sample Data
```sql
-- Insert sample products
INSERT INTO public.products (nama_produk, deskripsi, harga, kategori, stok) VALUES
('Source Code Website E-Commerce', 'Website e-commerce lengkap dengan fitur cart, checkout, payment gateway', 500000, 'Web Development', 10),
('Template Admin Dashboard', 'Template admin dashboard responsive dengan charts dan analytics', 300000, 'Web Development', 15),
('Mobile App Source Code', 'Source code aplikasi mobile Flutter untuk toko online', 750000, 'Mobile Development', 5);

-- Cek data
SELECT * FROM public.products;
```

### Langkah 2: Test Authentication
1. Buka aplikasi React Anda
2. Coba daftar dengan email valid
3. Cek di dashboard Supabase → Authentication → Users
4. Cek di dashboard Supabase → Table Editor → profiles

## 5. Konfigurasi Authentication

### Langkah 1: Setup Email Templates (Opsional)
Di dashboard Supabase:
1. Masuk ke **Authentication** → **Email Templates**
2. Customize template untuk:
   - Confirm signup
   - Magic Link
   - Change email address
   - Reset password

### Langkah 2: Configure Auth Settings
Di **Authentication** → **Settings**:
1. **Site URL**: URL aplikasi Anda
2. **Redirect URLs**: Tambahkan URL yang diizinkan
3. **Email auth**: Enable/disable sesuai kebutuhan
4. **Phone auth**: Enable jika diperlukan

## 6. Setup Environment Variables

### Langkah 1: Buat File .env
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ[your-anon-key]
VITE_SUPABASE_PROJECT_ID=[project-id]
```

### Langkah 2: Update Supabase Client
File `src/integrations/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://[project-id].supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJ[your-anon-key]";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## 7. Testing & Validation

### Cek Koneksi Database
```sql
-- Test koneksi
SELECT version();

-- Cek semua tabel
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Cek RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies WHERE schemaname = 'public';
```

### Test CRUD Operations
1. **Create**: Daftar user baru
2. **Read**: Ambil data produk
3. **Update**: Update profile user
4. **Delete**: Hapus item dari cart

## 8. Security Checklist

- ✅ Row Level Security (RLS) enabled di semua tabel
- ✅ Proper policies untuk setiap tabel
- ✅ Foreign key constraints
- ✅ Timestamp triggers
- ✅ Secure environment variables
- ✅ Input validation
- ✅ Error handling

## 9. Monitoring & Maintenance

### Dashboard Monitoring
- **Logs**: Supabase → Logs
- **Metrics**: Database performance
- **Users**: Active users monitoring
- **API**: Request monitoring

### Backup Strategy
1. Enable automated backups di Supabase
2. Export data secara berkala
3. Test restore procedures

## 10. Next Steps

1. Setup payment gateway (Stripe/Tripay)
2. Configure email services (Resend)
3. Add file storage untuk uploads
4. Implement real-time features
5. Setup monitoring dan analytics

## Troubleshooting

### Common Issues
1. **Connection refused**: Cek network dan credentials
2. **RLS policy denied**: Review policies
3. **Foreign key constraint**: Cek referential integrity
4. **Authentication failed**: Verify JWT tokens

### Useful Commands
```sql
-- Reset RLS policies
DROP POLICY IF EXISTS policy_name ON table_name;

-- Check user permissions
SELECT * FROM auth.users WHERE email = 'user@example.com';

-- Monitor active connections
SELECT * FROM pg_stat_activity;
```

---

**Selesai!** Database PostgreSQL Anda sudah siap digunakan dengan Supabase. Ikuti tutorial selanjutnya untuk setup email dan payment gateway.