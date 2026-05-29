import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectHierarchy() {
  const { data: profiles, error } = await supabase.from('profiles').select('id, first_name, last_name, manager_id, role');
  if (error) {
    console.error(error);
    return;
  }

  console.log("All Profiles:");
  console.table(profiles);

  const managers = profiles.filter(p => p.role === 'manager' || p.role === 'hr');
  console.log("\nPotential Managers:");
  console.table(managers);

  for (const mgr of managers) {
    const reports = profiles.filter(p => p.manager_id === mgr.id);
    console.log(`\nManager: ${mgr.first_name} ${mgr.last_name} (${mgr.id})`);
    console.log(`Reports: ${reports.length}`);
    if (reports.length > 0) {
      console.table(reports.map(r => ({ id: r.id, name: `${r.first_name} ${r.last_name}`, role: r.role })));
    }
  }
}

inspectHierarchy();
