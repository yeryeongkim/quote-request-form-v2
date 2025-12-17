import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhnhdacjqeclggubhths.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpobmhkYWNqcWVjbGdndWJodGhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTc2NDYsImV4cCI6MjA4MTQzMzY0Nn0.4fplgVL48GLScXIGJTEjdf2bOdywyc_RiEdDTFty1Yc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
