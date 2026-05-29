
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

async function fixPillars() {
    const pillarIds = [
        '538ac60c-1d52-4527-84a9-86c148172483', // Leadership
        '449df065-bc1e-4e46-a9c6-3e48151cea96'  // Execution and Delivery
    ];

    console.log('--- Locking Pillars ---');
    const { data, error } = await supabase.from('themes')
        .update({ is_locked: true, status: 'approved' })
        .in('id', pillarIds);

    if (error) {
        console.error('Error updating themes:', error);
    } else {
        console.log('Successfully updated themes to be locked and approved.');
    }
}

fixPillars();
