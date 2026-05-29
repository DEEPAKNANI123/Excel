import { db } from './dbClient';

// Previous Supabase Config (Commented out)
/*
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
*/

// Use the new custom PostgreSQL backend proxy
export const supabase = db;
