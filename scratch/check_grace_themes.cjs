const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function run() {
  const { data: grace } = await supabase.from('profiles').select('id, first_name').eq('first_name', 'Grace').single();
  console.log('Grace Profile:', JSON.stringify(grace, null, 2));

  if (grace) {
    const { data: themes } = await supabase.from('themes').select('*').eq('employee_id', grace.id);
    console.log('Grace Themes:', JSON.stringify(themes, null, 2));
  }
}
run();
