const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function run() {
  const CYCLE_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const GRACE_ID = '00000000-0000-0000-0000-000000000010';
  
  const { data: themes, error } = await supabase.from('themes')
    .select('*')
    .eq('cycle_id', CYCLE_ID)
    .or(`employee_id.eq.${GRACE_ID},assigned_to.eq.${GRACE_ID}`);
    
  console.log('Themes for Grace in Cycle:', JSON.stringify(themes, null, 2));
  if (error) console.log('Error:', error);
}
run();
