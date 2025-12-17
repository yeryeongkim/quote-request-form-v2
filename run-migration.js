import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhnhdacjqeclggubhths.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmhkYWNqcWVjbGdndWJodGhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg1NzY0NiwiZXhwIjoyMDgxNDMzNjQ2fQ.6uCqY-8jwjch2rWtJLtRaF394LqxlyXk0rUHrIEwh1Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running database migration...\n');

  // Step 1: Add assigned_host_id column to quote_requests
  console.log('1. Adding assigned_host_id column to quote_requests...');
  const { error: error1 } = await supabase.rpc('exec', {
    query: `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS assigned_host_id uuid REFERENCES auth.users(id);`
  });

  if (error1) {
    console.log('   Using alternative method...');
    // Try raw query approach - check if column exists first
    const { data: cols } = await supabase
      .from('quote_requests')
      .select('*')
      .limit(0);
    console.log('   Column check completed');
  }

  // Step 2: Create host_quotes table
  console.log('2. Creating host_quotes table...');

  // Check if table exists by trying to select from it
  const { error: tableCheck } = await supabase
    .from('host_quotes')
    .select('id')
    .limit(1);

  if (tableCheck && tableCheck.code === 'PGRST204') {
    console.log('   Table does not exist yet - needs manual creation');
  } else if (tableCheck) {
    console.log('   Error checking table:', tableCheck.message);
  } else {
    console.log('   Table already exists!');
  }

  console.log('\n=== Migration Status ===');
  console.log('The Supabase JS client cannot execute DDL (CREATE TABLE, ALTER TABLE) statements.');
  console.log('Please run the SQL manually in Supabase Dashboard SQL Editor.\n');
  console.log('Go to: https://supabase.com/dashboard/project/zhnhdacjqeclggubhths/sql/new');
  console.log('\nSQL to run:');
  console.log('---');

  const sql = `
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_host_quotes_quote_request_id ON host_quotes(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_host_quotes_host_id ON host_quotes(host_id);
CREATE INDEX IF NOT EXISTS idx_host_quotes_status ON host_quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_assigned_host_id ON quote_requests(assigned_host_id);

-- Enable RLS
ALTER TABLE host_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Hosts can read own quotes" ON host_quotes
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert own quotes" ON host_quotes
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own pending quotes" ON host_quotes
  FOR UPDATE USING (auth.uid() = host_id AND status = 'pending');

CREATE POLICY "Hosts can read assigned quote requests" ON quote_requests
  FOR SELECT USING (auth.uid() = assigned_host_id);

-- Create storage bucket for space photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('space-photos', 'space-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for space photos
CREATE POLICY "Anyone can read space photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'space-photos');

CREATE POLICY "Authenticated users can upload space photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'space-photos' AND auth.role() = 'authenticated');
`;

  console.log(sql);
}

runMigration().catch(console.error);
