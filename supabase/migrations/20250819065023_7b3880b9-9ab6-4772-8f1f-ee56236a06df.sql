-- Fix security linter issues

-- Add missing RLS policies for otp_codes table
CREATE POLICY "Admin can manage all OTP codes" ON public.otp_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own OTP codes" ON public.otp_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Add missing RLS policies for redeem_codes table  
CREATE POLICY "Admin can manage redeem codes" ON public.redeem_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can use redeem codes" ON public.redeem_codes
  FOR SELECT USING (status = 'active');

-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY definer 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nama)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', new.email));
  RETURN new;
END;
$$;