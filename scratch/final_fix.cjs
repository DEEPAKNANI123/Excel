const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findUserAndFix() {
  const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, role');
  
  const user = profiles.find(p => p.first_name.includes('Vidula'));
  if (!user) {
    console.log("Vidula not found");
    return;
  }

  console.log(`Found User: ${user.first_name} ${user.last_name} (${user.id})`);

  // Assign 3 random employees to this user
  const candidates = profiles.filter(p => p.role === 'employee' && p.id !== user.id).slice(0, 3);
  
  for (const c of candidates) {
    console.log(`Assigning ${c.first_name} to ${user.first_name}...`);
    await supabase.from('profiles').update({ manager_id: user.id }).eq('id', c.id);
  }

  console.log("Hierarchy fixed.");
}

findUserAndFix();
