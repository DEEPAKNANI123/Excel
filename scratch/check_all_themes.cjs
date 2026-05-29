
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllThemes() {
    console.log('--- Checking ALL Themes ---');
    const { data: themes, error } = await supabase.from('themes').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(`Total themes: ${themes.length}`);
    
    const locked = themes.filter(t => t.is_locked);
    console.log(`Locked themes (pillars): ${locked.length}`);
    locked.forEach(t => console.log(`- ${t.id}: ${t.title} (Status: ${t.status})`));

    const graceId = "00000000-0000-0000-0000-000000000010";
    const graceThemes = themes.filter(t => t.employee_id === graceId);
    console.log(`\nGrace's themes: ${graceThemes.length}`);
    graceThemes.forEach(t => {
        console.log(`- ${t.id}: ${t.title} (Parent: ${t.parent_id}, Main: ${t.main_theme_id})`);
    });

    // Check if Grace's parent_ids exist in the themes list
    graceThemes.forEach(t => {
        if (t.parent_id) {
            const parent = themes.find(p => p.id === t.parent_id);
            if (parent) {
                console.log(`  -> Parent FOUND: ${parent.title} (is_locked: ${parent.is_locked})`);
            } else {
                console.log(`  -> Parent NOT FOUND: ${t.parent_id}`);
            }
        }
    });
}

checkAllThemes();
