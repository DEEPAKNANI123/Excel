
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkvkuxyggdlsrtkqechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function findColumns() {
  // Try to insert a dummy record to see what columns are allowed
  const { data, error } = await supabase.from('monthly_reviews').insert({
    employee_id: '526cfc04-e8d3-4100-b7d4-c4b155711d0e',
    cycle_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    manager_id: '00000000-0000-0000-0000-000000000001',
    overall_result: 'PENDING'
  }).select();

  if (error) {
    console.error('Insert error:', error);
  } else if (data && data.length > 0) {
    console.log('Available columns in monthly_reviews:', Object.keys(data[0]));
  }
}

findColumns();
