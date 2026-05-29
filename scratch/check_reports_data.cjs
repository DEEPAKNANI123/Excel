const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkApprovedData() {
  const praveenId = '00000000-0000-0000-0000-000000400089';
  
  // 1. Get reports
  const { data: reports } = await supabase.from('profiles').select('id, first_name, last_name').eq('manager_id', praveenId);
  const ids = reports.map(r => r.id);
  console.log("Praveen's Reports IDs:", ids);

  // 2. Get approved themes
  const { data: appThemes } = await supabase.from('themes').select('*').in('employee_id', ids).eq('status', 'approved');
  console.log("Approved Themes:", appThemes);

  // 3. Get monthly reviews
  const { data: reviews } = await supabase.from('monthly_reviews').select('*').in('employee_id', ids);
  console.log("Monthly Reviews:", reviews);
}

checkApprovedData();
