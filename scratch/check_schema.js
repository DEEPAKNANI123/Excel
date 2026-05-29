
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkvkuxyggdlsrtkqechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('monthly_reviews')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching schema:', error);
  } else if (data && data.length > 0) {
    console.log('Sample record columns:', Object.keys(data[0]));
  } else {
    // If no data, try to select something else to trigger error or find columns
    console.log('No data found in monthly_reviews. Trying to trigger column list...');
    const { error: err2 } = await supabase.from('monthly_reviews').select('non_existent_column');
    console.log('Error hint for columns:', err2?.message);
  }
}

checkSchema();
