const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function run() {
  const { data: logs, error } = await supabase.from('sf_sync_log').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('SF Sync Logs (Last 5):', JSON.stringify(logs, null, 2));
  if (error) console.log('Error:', error);
}
run();
