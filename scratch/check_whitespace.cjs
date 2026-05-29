const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function run() {
  const { data: themes } = await supabase.from('themes').select('id, title, cycle_id, employee_id, assigned_to').limit(5);
  console.log('Themes Sample:');
  themes.forEach(t => {
    console.log(`- Title: "${t.title}"`);
    console.log(`  Cycle: "${t.cycle_id}" (len: ${t.cycle_id?.length})`);
    console.log(`  EmpID: "${t.employee_id}" (len: ${t.employee_id?.length})`);
    console.log(`  AssignedTo: "${t.assigned_to}" (len: ${t.assigned_to?.length})`);
  });
}
run();
