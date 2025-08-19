-- Fix trigger issue and create enhanced order system
CREATE TABLE IF NOT EXISTS public.supplier_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transaction logs table
CREATE TABLE IF NOT EXISTS public.transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  supplier_id UUID REFERENCES supplier_configs(id),
  status TEXT NOT NULL DEFAULT 'pending',
  supplier_response JSONB,
  balance_before DECIMAL(12,2),
  balance_after DECIMAL(12,2),
  cost_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhance orders table with more fields
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS supplier_order_id TEXT,
ADD COLUMN IF NOT EXISTS supplier_status TEXT,
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Create order_items table for multiple items per order
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  product_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.supplier_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Admin policies for supplier_configs
CREATE POLICY "Admin can manage supplier configs" ON public.supplier_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Admin policies for transaction_logs  
CREATE POLICY "Admin can view transaction logs" ON public.transaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- System can insert transaction logs
CREATE POLICY "System can insert transaction logs" ON public.transaction_logs
  FOR INSERT WITH CHECK (true);

-- Order items policies
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage order items" ON public.order_items
  FOR ALL WITH CHECK (true);

-- Update orders table policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update orders" ON public.orders
  FOR UPDATE USING (true);

-- Create trigger for supplier_configs updated_at only
CREATE TRIGGER update_supplier_configs_updated_at
  BEFORE UPDATE ON supplier_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();