const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function correctRikazHierarchy() {
  const rikazId = '00000000-0000-0000-0000-000000400437';
  const vidulaId = '00000000-0000-0000-0000-000000400023';

  console.log("Swapping hierarchy: Making Rikaz report to Vidula...");

  // 1. Set Rikaz's manager to Vidula
  await supabase.from('profiles').update({ manager_id: vidulaId }).eq('id', rikazId);

  // 2. Clear Vidula's manager (or set to HR) so it's not circular
  await supabase.from('profiles').update({ manager_id: '00000000-0000-0000-0000-000000400089' }).eq('id', vidulaId);

  console.log("Hierarchy corrected. Rikaz now reports to Vidula.");
}

correctRikazHierarchy();
