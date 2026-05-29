
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

async function checkConstraints() {
    // Since we don't have a generic SQL RPC, let's try to infer from data or try common RPC names
    // Actually, I can just try to insert a record with a null main_theme_id to see if it works
    // Or I can look at the error message again: "themes_main_theme_id_fkey"
    
    // Let's try to find out where main_theme_id points to.
    // I'll try to insert a theme with a non-existent main_theme_id and see the error message detail if possible.
    
    console.log("Checking if main_themes table exists and has content...");
    const { data: mt, error: mtErr } = await supabase.from('main_themes').select('*').limit(1);
    if (mtErr) {
        console.log("main_themes table error:", mtErr.message);
    } else {
        console.log("main_themes exists. Content:", mt);
    }
}

checkConstraints();
