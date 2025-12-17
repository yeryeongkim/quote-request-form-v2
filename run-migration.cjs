const { Client } = require('pg');

// Direct database connection
const client = new Client({
  host: 'db.zhnhdacjqeclggubhths.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'globalrich!25',
  ssl: {
    rejectUnauthorized: false
  }
});

const migrations = [
  {
    name: 'Add assigned_host_id column',
    sql: `ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS assigned_host_id uuid;`
  },
  {
    name: 'Create host_quotes table',
    sql: `
      CREATE TABLE IF NOT EXISTS host_quotes (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        quote_request_id uuid,
        host_id uuid,
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
    `
  },
  {
    name: 'Create index on quote_request_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_host_quotes_quote_request_id ON host_quotes(quote_request_id);`
  },
  {
    name: 'Create index on host_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_host_quotes_host_id ON host_quotes(host_id);`
  },
  {
    name: 'Create index on status',
    sql: `CREATE INDEX IF NOT EXISTS idx_host_quotes_status ON host_quotes(status);`
  },
  {
    name: 'Create index on assigned_host_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_quote_requests_assigned_host_id ON quote_requests(assigned_host_id);`
  },
  {
    name: 'Enable RLS on host_quotes',
    sql: `ALTER TABLE host_quotes ENABLE ROW LEVEL SECURITY;`
  },
  {
    name: 'Create policy: Hosts can read own quotes',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Hosts can read own quotes' AND tablename = 'host_quotes') THEN
          CREATE POLICY "Hosts can read own quotes" ON host_quotes FOR SELECT USING (auth.uid() = host_id);
        END IF;
      END $$;
    `
  },
  {
    name: 'Create policy: Hosts can insert own quotes',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Hosts can insert own quotes' AND tablename = 'host_quotes') THEN
          CREATE POLICY "Hosts can insert own quotes" ON host_quotes FOR INSERT WITH CHECK (auth.uid() = host_id);
        END IF;
      END $$;
    `
  },
  {
    name: 'Create policy: Hosts can update own pending quotes',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Hosts can update own pending quotes' AND tablename = 'host_quotes') THEN
          CREATE POLICY "Hosts can update own pending quotes" ON host_quotes FOR UPDATE USING (auth.uid() = host_id AND status = 'pending');
        END IF;
      END $$;
    `
  },
  {
    name: 'Create policy: Service role can manage all host_quotes',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage all host_quotes' AND tablename = 'host_quotes') THEN
          CREATE POLICY "Service role can manage all host_quotes" ON host_quotes FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `
  }
];

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!\n');

    for (const migration of migrations) {
      console.log(`Running: ${migration.name}...`);
      try {
        await client.query(migration.sql);
        console.log(`  ✓ Success\n`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ✓ Already exists (skipped)\n`);
        } else {
          console.log(`  ✗ Error: ${err.message}\n`);
        }
      }
    }

    console.log('Migration completed!');
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
