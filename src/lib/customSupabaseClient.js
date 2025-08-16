import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hamtxlvcgnbssndedeml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhbXR4bHZjZ25ic3NuZGVkZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDI4MzgsImV4cCI6MjA2NzQ3ODgzOH0.clwQE1M6lN9owcdw2BNNlP-IwUBsl626mWgGmj9ekII';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);