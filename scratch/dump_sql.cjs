require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToExport = ['profiles', 'cycles', 'main_themes', 'themes', 'monthly_reviews'];

async function exportSchema() {
    let sqlDump = `-- PostgreSQL Schema Dump from Supabase\n\n`;

    for (const table of tablesToExport) {
        console.log(`Fetching data for table: ${table}`);
        const { data, error } = await supabase.from(table).select('*');
        
        if (error) {
            console.error(`Error fetching table ${table}:`, error.message);
            continue;
        }

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            sqlDump += `-- Table structure for ${table}\n`;
            sqlDump += `CREATE TABLE IF NOT EXISTS public."${table}" (\n`;
            
            const colDefs = columns.map(col => `    "${col}" TEXT`).join(',\n');
            sqlDump += colDefs + '\n);\n\n';

            sqlDump += `-- Data for ${table}\n`;
            for (const row of data) {
                const values = columns.map(col => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                    return val;
                });
                sqlDump += `INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
            }
            sqlDump += '\n';
        } else {
             console.log(`Table ${table} is empty or inaccessible.`);
             sqlDump += `-- Table ${table} is empty. Cannot infer schema from data.\n\n`;
        }
    }

    fs.writeFileSync('database_dump.sql', sqlDump);
    console.log("Export completed: database_dump.sql");
}

exportSchema();
