const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateHierarchy() {
  console.log("🚀 Starting Hierarchy Update...");

  // 1. Get Manager UUIDs
  const { data: managers, error: mgrError } = await supabase
    .from('profiles')
    .select('id, employee_id')
    .in('employee_id', ['EMP-002', 'EMP-003']);

  if (mgrError) {
    console.error("❌ Error fetching managers:", mgrError.message);
    return;
  }

  const managerMap = {};
  managers.forEach(m => managerMap[m.employee_id] = m.id);

  console.log("📍 Managers found:", managerMap);

  if (!managerMap['EMP-002'] || !managerMap['EMP-003']) {
    console.error("❌ Could not find UUIDs for EMP-002 or EMP-003!");
    return;
  }

  // 2. Define Groups
  const group1 = [];
  for (let i = 205; i <= 213; i++) group1.push(`EMP-${i}`);
  
  const group2 = [];
  for (let i = 214; i <= 220; i++) group2.push(`EMP-${i}`);

  console.log(`📊 Group 1 (EMP-002): ${group1.join(', ')}`);
  console.log(`📊 Group 2 (EMP-003): ${group2.join(', ')}`);

  // 3. Update Group 1
  const { error: err1 } = await supabase
    .from('profiles')
    .update({ manager_id: managerMap['EMP-002'] })
    .in('employee_id', group1);

  if (err1) {
    console.error("❌ Error updating Group 1:", err1.message);
  } else {
    console.log("✅ Group 1 updated successfully.");
  }

  // 4. Update Group 2
  const { error: err2 } = await supabase
    .from('profiles')
    .update({ manager_id: managerMap['EMP-003'] })
    .in('employee_id', group2);

  if (err2) {
    console.error("❌ Error updating Group 2:", err2.message);
  } else {
    console.log("✅ Group 2 updated successfully.");
  }

  console.log("🏁 Hierarchy update complete.");
}

updateHierarchy();
