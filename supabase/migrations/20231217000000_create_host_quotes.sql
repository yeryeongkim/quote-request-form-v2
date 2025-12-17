-- Add assigned_host_id column to quote_requests table
ALTER TABLE quote_requests
ADD COLUMN IF NOT EXISTS assigned_host_id uuid REFERENCES auth.users(id);

-- Create host_quotes table
CREATE TABLE IF NOT EXISTS host_quotes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id uuid REFERENCES quote_requests(id) ON DELETE CASCADE,
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  space_photo_url text,
  price integer NOT NULL,
  currency text DEFAULT 'KRW',
  price_includes text,
  payment_method text NOT NULL CHECK (payment_method IN ('onsite', 'online')),
  stripe_link text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_host_quotes_quote_request_id ON host_quotes(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_host_quotes_host_id ON host_quotes(host_id);
CREATE INDEX IF NOT EXISTS idx_host_quotes_status ON host_quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_assigned_host_id ON quote_requests(assigned_host_id);

-- Enable RLS
ALTER TABLE host_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can read their own quotes
CREATE POLICY "Hosts can read own quotes" ON host_quotes
  FOR SELECT USING (auth.uid() = host_id);

-- Policy: Hosts can insert their own quotes
CREATE POLICY "Hosts can insert own quotes" ON host_quotes
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Policy: Hosts can update their own quotes (before sent)
CREATE POLICY "Hosts can update own pending quotes" ON host_quotes
  FOR UPDATE USING (auth.uid() = host_id AND status = 'pending');

-- Policy: Allow authenticated users to read quote_requests assigned to them
CREATE POLICY "Hosts can read assigned quote requests" ON quote_requests
  FOR SELECT USING (auth.uid() = assigned_host_id);
