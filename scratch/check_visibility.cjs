const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function run() {
  const { data, error } = await supabase.rpc('get_policies_debug'); // This might not work
  // Try to see if we can see something we shouldn't
  const { data: allProfiles } = await supabase.from('profiles').select('id');
  console.log('Visible Profiles count:', allProfiles?.length);
  
  const { data: allThemes } = await supabase.from('themes').select('id');
  console.log('Visible Themes count:', allThemes?.length);
}
run();
