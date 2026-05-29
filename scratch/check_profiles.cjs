const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, employee_id, first_name, last_name, role, manager_id')
    .in('employee_id', ['EMP005', 'EMP016', 'EMP001']);
  
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkProfiles();
