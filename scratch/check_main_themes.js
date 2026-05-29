import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('main_themes').select('*');
  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    console.log(`✅ Success! Found ${data?.length} themes:`, data);
  }
}

check();
