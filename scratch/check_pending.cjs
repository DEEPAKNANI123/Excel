const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPendingThemes() {
  const vidulaId = '00000000-0000-0000-0000-000000400023';
  
  const { data: reports } = await supabase.from('profiles').select('id').eq('manager_id', vidulaId);
  const ids = reports.map(r => r.id);

  const { data: pendingThemes } = await supabase.from('themes')
    .select('*')
    .in('employee_id', ids)
    .eq('status', 'pending_review');

  console.log("Pending Subthemes for Vidula's Team:");
  console.log(JSON.stringify(pendingThemes, null, 2));
}

checkPendingThemes();
