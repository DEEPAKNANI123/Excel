import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const supabase = createClient(supabaseUrl, supabaseKey);

const CYCLE_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const SATYA_ID = '00000000-0000-0000-0000-000000000001';

const pillars = [
  { title: "Delivery Quality", category: "Delivery Quality", description: "Ensuring high standards in project execution and final deliverables." },
  { title: "Stakeholder Collaboration", category: "Stakeholder Collaboration", description: "Building strong relationships and alignment across all project partners." },
  { title: "Technical Initiative", category: "Technical Initiative", description: "Driving innovation and technical excellence in our solutions." },
  { title: "Process Improvement", category: "Process Improvement", description: "Optimizing internal workflows for maximum efficiency and speed." },
  { title: "Leadership & Mentoring", category: "Leadership & Mentoring", description: "Developing talent and providing guidance to team members." }
];

async function seed() {
  console.log("🚀 Starting database seed...");
  
  const insertData = pillars.map(p => ({
    ...p,
    employee_id: SATYA_ID,
    assigned_by: SATYA_ID,
    assigned_to: SATYA_ID,
    cycle_id: CYCLE_ID,
    status: 'approved',
    parent_id: null
  }));

  const { data, error } = await supabase.from('themes').insert(insertData).select();

  if (error) {
    console.error("❌ Error seeding database:", error.message);
  } else {
    console.log("✅ Success! 5 Strategic Themes inserted.");
    console.log(data);
  }
}

seed();
