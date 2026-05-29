const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  'https://zkvkuxyggdlsrtkqechs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4'
);

async function checkActualProfiles() {
  const { data, error } = await supabase.from('profiles').select('id, employee_id, first_name, last_name').limit(5);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Profiles in VITE_SUPABASE_URL:', JSON.stringify(data, null, 2));
  }
}

checkActualProfiles();
