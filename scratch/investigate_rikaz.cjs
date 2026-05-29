const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findRikazAndManager() {
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, role, manager_id');
  
  const rikaz = profiles.find(p => p.first_name.includes('Rikaz'));
  const vidula = profiles.find(p => p.first_name.includes('Vidula'));

  console.log("Profile Data:");
  console.log("Rikaz:", rikaz);
  console.log("Vidula:", vidula);

  if (rikaz) {
    const { data: rikazThemes } = await supabase.from('themes')
      .select('id, title, status, employee_id, assigned_to')
      .eq('employee_id', rikaz.id);
    console.log("\nRikaz's Themes:");
    console.log(JSON.stringify(rikazThemes, null, 2));
  }
}

findRikazAndManager();
