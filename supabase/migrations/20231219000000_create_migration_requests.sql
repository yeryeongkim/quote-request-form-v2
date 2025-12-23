-- Migration requests table for booking service migration
CREATE TABLE IF NOT EXISTS migration_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name text NOT NULL,
  host_email text NOT NULL,
  host_phone text,
  selected_space_ids jsonb NOT NULL,
  consent_data_migration boolean NOT NULL DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_migration_requests_host_id ON migration_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_migration_requests_status ON migration_requests(status);

-- Prevent duplicate pending requests per host
CREATE UNIQUE INDEX IF NOT EXISTS idx_migration_requests_unique_pending
  ON migration_requests(host_id)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE migration_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can read their own migration requests
CREATE POLICY "Hosts can read own migration requests" ON migration_requests
  FOR SELECT USING (auth.uid() = host_id);

-- Policy: Hosts can insert their own migration requests
CREATE POLICY "Hosts can insert own migration requests" ON migration_requests
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Policy: Admins can read all migration requests (service role)
CREATE POLICY "Service role can manage all migration requests" ON migration_requests
  FOR ALL USING (auth.role() = 'service_role');
