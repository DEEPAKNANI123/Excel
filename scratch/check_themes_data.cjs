const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function run() {
  const { data: mainThemes } = await supabase.from('main_themes').select('id, name, title');
  console.log('Main Themes:', JSON.stringify(mainThemes, null, 2));

  const { data: lockedThemes } = await supabase.from('themes').select('id, title, is_locked').eq('is_locked', true);
  console.log('Locked Themes:', JSON.stringify(lockedThemes, null, 2));
}
run();
