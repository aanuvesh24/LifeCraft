import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__TsIeaVC8lapuADbLFIJKg_UGNHbXgh';

// Create Supabase client only if URL is provided, otherwise export null/dummy client
export const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseAnonKey) : null;
