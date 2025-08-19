-- Create database schema for ArfCoder platform

-- Users table (extending Supabase auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nama TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- OTP codes table
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kode TEXT NOT NULL,
  expired_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_produk TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('pulsa', 'kuota', 'game', 'bot')),
  harga INTEGER NOT NULL,
  stok INTEGER DEFAULT 0,
  deskripsi TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  jumlah INTEGER NOT NULL DEFAULT 1,
  total INTEGER NOT NULL,
  metode_bayar TEXT,
  status_bayar TEXT DEFAULT 'pending' CHECK (status_bayar IN ('pending', 'paid', 'failed', 'cancelled')),
  data_input JSONB, -- nomor HP / ID Game / Server
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Licenses table
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  link_download TEXT,
  tutorial TEXT,
  kode_lisensi TEXT UNIQUE,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Stories table (cerpen/komik)
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  penulis_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kategori TEXT CHECK (kategori IN ('cerpen', 'komik')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'diterima', 'ditolak')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Redeem codes table
CREATE TABLE public.redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode TEXT UNIQUE NOT NULL,
  reward TEXT NOT NULL, -- akses chatbot, credit, dll
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pesan TEXT NOT NULL,
  tipe TEXT DEFAULT 'info' CHECK (tipe IN ('info', 'success', 'warning', 'error')),
  status_baca BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for products (public read)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (aktif = true);

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for licenses
CREATE POLICY "Users can view their own licenses" ON public.licenses
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for stories
CREATE POLICY "Anyone can view approved stories" ON public.stories
  FOR SELECT USING (status = 'diterima');

CREATE POLICY "Users can create stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = penulis_id);

CREATE POLICY "Users can view their own stories" ON public.stories
  FOR SELECT USING (auth.uid() = penulis_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status_bayar);
CREATE INDEX idx_stories_status ON public.stories(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_redeem_codes_kode ON public.redeem_codes(kode);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY definer SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nama)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', new.email));
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert sample products
INSERT INTO public.products (nama_produk, kategori, harga, stok, deskripsi) VALUES
('Pulsa Telkomsel 10K', 'pulsa', 11000, 100, 'Top-up pulsa Telkomsel 10.000'),
('Pulsa XL 25K', 'pulsa', 26000, 100, 'Top-up pulsa XL 25.000'),
('Kuota Indosat 3GB', 'kuota', 15000, 50, 'Paket data Indosat 3GB 30 hari'),
('Mobile Legends 275 Diamond', 'game', 75000, 200, 'Top-up ML 275 Diamond'),
('PUBG Mobile 325 UC', 'game', 85000, 150, 'Top-up PUBG Mobile 325 UC'),
('Free Fire 70 Diamond', 'game', 12000, 300, 'Top-up Free Fire 70 Diamond'),
('WhatsApp Bot Premium', 'bot', 150000, 20, 'Bot WhatsApp dengan fitur lengkap'),
('Telegram Bot Business', 'bot', 250000, 15, 'Bot Telegram untuk bisnis'),
('Social Media Bot', 'bot', 300000, 10, 'Bot otomatisasi social media');