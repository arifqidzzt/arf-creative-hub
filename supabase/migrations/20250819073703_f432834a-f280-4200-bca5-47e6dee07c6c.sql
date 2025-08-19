-- Add some sample license data and fix RLS policies
INSERT INTO public.licenses (kode_lisensi, aktif, tutorial, link_download, product_id)
VALUES 
  ('ARFCODER2024PRO', true, 'Tutorial: Download dan ekstrak file. Jalankan setup.exe sebagai administrator.', 'https://example.com/download/pro-license', NULL),
  ('ARFCODER2024BOT', true, 'Tutorial: Import bot ke WhatsApp Business API dan konfigurasi webhook.', 'https://example.com/download/bot-license', NULL);

-- Add policy for inserting licenses (for admin or system)
CREATE POLICY "Admin can manage licenses" ON public.licenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add policy for creating licenses from orders (system use)
CREATE POLICY "System can create licenses" ON public.licenses
FOR INSERT WITH CHECK (true);