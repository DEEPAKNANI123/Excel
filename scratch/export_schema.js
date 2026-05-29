import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function exportSchema() {
  // Try to query information_schema if possible, but PostgREST often restricts it.
  // We can query our known tables or make an RPC call.
  // Instead, let's just make a REST query to some known tables to get their structure.
  const tables = ['profiles', 'cycles', 'main_themes', 'themes', 'monthly_reviews']; // Adjust if there are different ones
  
  const schema = {};
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Error fetching ${table}:`, error.message);
    } else {
      if (data && data.length > 0) {
        schema[table] = Object.keys(data[0]);
      } else {
        schema[table] = "Empty, need a way to get columns. Let's try RPC or inserting/deleting if necessary.";
      }
    }
  }
  
  fs.writeFileSync('schema_export.json', JSON.stringify(schema, null, 2));
  console.log("Schema exported based on first rows");
}

exportSchema();
