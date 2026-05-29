const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const url1 = process.env.VITE_SUPABASE_URL;
const key1 = process.env.VITE_SUPABASE_ANON_KEY;

const url2 = 'https://jmnjguadgmdyxfrmecpn.supabase.co';
const key2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbmpndWFkZ21keXhmcm1lY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDg1MDMsImV4cCI6MjA5MTQ4NDUwM30.JJdJgW_N922_aotLraP0ib4BUY7Pr5ucZnJgXF6-XFs';

const tablesToExport = ['profiles', 'cycles', 'main_themes', 'themes', 'monthly_reviews'];

async function checkInstance(url, key, name) {
    console.log(`\nChecking instance: ${name} (${url})`);
    const supabase = createClient(url, key);
    let validTables = 0;
    
    for (const table of tablesToExport) {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`  ❌ ${table}: ${error.message}`);
        } else {
            console.log(`  ✅ ${table}: Found (${data.length} rows sample)`);
            validTables++;
        }
    }
    return validTables;
}

async function main() {
    await checkInstance(url1, key1, 'From .env');
    await checkInstance(url2, key2, 'From inspect_tables.cjs');
}

main();
