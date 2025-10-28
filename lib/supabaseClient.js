// /lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This client is safe to use for public reads (we disabled RLS for artists in MVP)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
