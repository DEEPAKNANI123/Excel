
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFK() {
    // I don't have exec_sql RPC, so I have to guess or use data
    // I'll try to insert a record with main_theme_id set to one of the pillar IDs 
    // and see if it fails with the same error.
    
    const pillarId = '449df065-bc1e-4e46-a9c6-3e48151cea96'; // Execution and Delivery (in themes table)
    
    console.log("Testing insert with main_theme_id =", pillarId);
    const { error } = await supabase.from('themes').insert([{
        title: 'Test',
        category: 'Delivery Quality',
        employee_id: '00000000-0000-0000-0000-000000000001',
        cycle_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        main_theme_id: pillarId
    }]);
    
    if (error) {
        console.log("Error detail:", error);
    } else {
        console.log("Insert successful! (main_theme_id accepts themes(id))");
        // Cleanup
        await supabase.from('themes').delete().eq('title', 'Test');
    }
}

checkFK();
