const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function checkMainThemes() {
  const { data, error } = await supabase.from('main_themes').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Main Themes data:', JSON.stringify(data, null, 2));
  }
}

checkMainThemes();
