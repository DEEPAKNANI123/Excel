
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load from .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGrace() {
    console.log('--- Checking Profile ---');
    const { data: profile, error: pError } = await supabase.from('profiles').select('*').ilike('first_name', '%Grace%').single();
    if (pError) {
        console.error('Error fetching profile:', pError);
        return;
    }
    console.log(JSON.stringify(profile, null, 2));

    const graceId = profile.id;
    const cycleId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    console.log('\n--- Checking Root Themes (main_themes) ---');
    const { data: rootThemes, error: rError } = await supabase.from('main_themes').select('*');
    if (rError) console.error('Error fetching main_themes:', rError);
    else console.log(JSON.stringify(rootThemes, null, 2));

    console.log('\n--- Checking Grace\'s Themes ---');
    const { data: themes, error: tError } = await supabase.from('themes')
        .select('*')
        .or(`employee_id.eq.${graceId},assigned_to.eq.${graceId},is_locked.eq.true`)
        .eq('cycle_id', cycleId);
    
    if (tError) console.error('Error fetching themes:', tError);
    else console.log(JSON.stringify(themes, null, 2));
}

checkGrace();
