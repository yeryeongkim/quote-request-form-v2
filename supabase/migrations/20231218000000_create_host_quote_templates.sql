-- Create host_quote_templates table for storing default quote settings per host
CREATE TABLE IF NOT EXISTS host_quote_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  space_photo_url text,
  default_price integer,
  currency text DEFAULT 'KRW',
  price_includes text,
  payment_method text CHECK (payment_method IN ('onsite', 'online')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_host_quote_templates_host_id ON host_quote_templates(host_id);

-- Enable RLS
ALTER TABLE host_quote_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can read their own template
CREATE POLICY "Hosts can read own template" ON host_quote_templates
  FOR SELECT USING (auth.uid() = host_id);

-- Policy: Hosts can insert their own template
CREATE POLICY "Hosts can insert own template" ON host_quote_templates
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Policy: Hosts can update their own template
CREATE POLICY "Hosts can update own template" ON host_quote_templates
  FOR UPDATE USING (auth.uid() = host_id);

-- Policy: Hosts can delete their own template
CREATE POLICY "Hosts can delete own template" ON host_quote_templates
  FOR DELETE USING (auth.uid() = host_id);
