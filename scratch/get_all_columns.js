
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkvkuxyggdlsrtkqechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllColumns() {
  // We can't use information_schema directly via anon key usually.
  // But we can try to trigger a broad error or use a known record.
  
  // Try to find ANY record
  const { data, error } = await supabase.from('monthly_reviews').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns found in record:', Object.keys(data[0]));
  } else {
    // Try to insert a record with almost nothing
    const { data: d2, error: e2 } = await supabase.from('monthly_reviews').insert({
       employee_id: '526cfc04-e8d3-4100-b7d4-c4b155711d0e',
       cycle_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
       manager_id: '00000000-0000-0000-0000-000000000001'
    }).select();
    
    if (d2 && d2.length > 0) {
      console.log('Columns found in newly inserted record:', Object.keys(d2[0]));
    } else {
      console.error('Could not find columns. Error:', e2);
    }
  }
}

getAllColumns();
