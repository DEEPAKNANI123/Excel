const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from('global_themes')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching global_themes:', error);
  } else {
    console.log('Columns in global_themes:', Object.keys(data[0] || {}));
  }

  const { data: cycles, error: cError } = await supabase
    .from('performance_cycles') // Assuming there's a cycles table
    .select('*');
  
  if (cError) {
    console.error('Error fetching cycles:', cError);
  } else {
    console.log('Available Cycles:', JSON.stringify(cycles, null, 2));
  }
}

checkSchema();
