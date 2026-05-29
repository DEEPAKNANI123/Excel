const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function checkSatya() {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single();
  if (error) {
    console.error('Satya not found:', error);
  } else {
    console.log('Satya Profile:', data);
  }
}

checkSatya();
