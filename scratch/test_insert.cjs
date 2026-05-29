const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function run() {
  const CYCLE_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
  const SATYA_ID = '00000000-0000-0000-0000-000000000001';
  
  const themeRecord = {
    title: 'Test Submission',
    description: 'Testing 400 error',
    category: 'Delivery Quality',
    employee_id: SATYA_ID,
    assigned_by: SATYA_ID,
    assigned_to: SATYA_ID,
    cycle_id: CYCLE_ID,
    status: 'submitted_to_manager',
    is_locked: false,
    start_date: '2026-04-01',
    end_date: '2026-04-30'
  };

  const { error } = await supabase.from('themes').insert([themeRecord]);
  if (error) {
    console.log('Insert Failed:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert Success!');
  }
}
run();
