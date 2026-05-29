import { createClient } from '@supabase/supabase-client';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'employee_subtheme_alignment' });
  // If rpc doesn't exist, try a simple select
  if (error) {
    const { data: cols, error: err2 } = await supabase.from('employee_subtheme_alignment').select('*').limit(1);
    if (cols && cols.length > 0) {
      console.log("Columns found:", Object.keys(cols[0]));
    } else {
        // Fallback: use a different way or just report error
        console.log("Error fetching columns. Assuming they don't exist.");
    }
  } else {
    console.log("Table structure:", data);
  }
}

checkSchema();
