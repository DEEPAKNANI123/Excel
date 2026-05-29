const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixHierarchy() {
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, role');
  
  const vidula = profiles.find(p => p.first_name === 'Vidula');
  if (!vidula) {
    console.log("Vidula not found");
    return;
  }

  console.log(`Found Vidula: ${vidula.id}`);

  // Assign some employees to Vidula
  const employees = profiles.filter(p => p.role === 'employee' && p.id !== vidula.id).slice(0, 3);
  
  for (const emp of employees) {
    console.log(`Assigning ${emp.first_name} to Vidula...`);
    await supabase.from('profiles').update({ manager_id: vidula.id }).eq('id', emp.id);
  }

  console.log("Hierarchy fixed. Please refresh your page.");
}

fixHierarchy();
