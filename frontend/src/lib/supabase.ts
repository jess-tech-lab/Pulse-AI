import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured with valid URLs
export const isSupabaseConfigured =
  supabaseUrl.startsWith('http') && supabaseAnonKey.length > 10;

// Only create client if configured
let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  tenant_id: string;
  role: 'admin' | 'member' | 'viewer';
  created_at: string;
};

export type Tenant = {
  id: string;
  name: string;
  created_at: string;
};
