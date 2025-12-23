-- Add space_name column to host_quotes table
ALTER TABLE host_quotes
ADD COLUMN IF NOT EXISTS space_name text;

-- Create index for searching by space_name
CREATE INDEX IF NOT EXISTS idx_host_quotes_space_name ON host_quotes(space_name);
