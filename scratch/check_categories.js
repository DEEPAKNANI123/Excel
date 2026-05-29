import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCategories() {
  const { data, error } = await supabase.from('themes').select('category').limit(5);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Existing categories in DB:', data);
  }
}

checkCategories();
