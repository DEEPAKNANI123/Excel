const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function inspectTables() {
  const { data: mainData, error: mainError } = await supabase.from('main_themes').select('*').limit(1);
  if (mainError) {
    console.error('Error main_themes:', mainError);
  } else {
    console.log('Sample main_themes row:', mainData[0]);
  }

  const { data: themesData, error: themesError } = await supabase.from('themes').select('*').limit(1);
  if (themesError) {
    console.error('Error themes:', themesError);
  } else {
    console.log('Sample themes row:', themesData[0]);
  }
}

inspectTables();
