import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evskpbbqojkclyyjvpjr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
