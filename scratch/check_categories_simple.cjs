const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://jmnjguadgmdyxfrmecpn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs');

async function checkCategories() {
  const { data, error } = await supabase.from('themes').select('category').limit(10);
  if (error) {
    console.error('Error fetching themes:', error);
  } else {
    console.log('Categories in themes table:', data.map(d => d.category));
  }

  const { data: mainData, error: mainError } = await supabase.from('main_themes').select('category').limit(10);
  if (mainError) {
    console.error('Error fetching main_themes:', mainError);
  } else {
    console.log('Categories in main_themes table:', mainData.map(d => d.category));
  }
}

checkCategories();
