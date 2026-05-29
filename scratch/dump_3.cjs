const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://zkvkuxyggdlsrtkqechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';

const supabase = createClient(supabaseUrl, supabaseKey);
const tablesToExport = ['global_themes', 'global_subthemes', 'employee_subtheme_alignment'];

async function run() {
  let sqlDump = '-- PostgreSQL Schema Dump Part 2\n\n';
  for (const table of tablesToExport) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) console.log(error);
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      sqlDump += 'CREATE TABLE IF NOT EXISTS public."' + table + '" (\n';
      sqlDump += columns.map(c => '    "' + c + '" TEXT').join(',\n') + '\n);\n\n';
      for (const row of data) {
        const values = columns.map(c => {
            const v = row[c];
            if (v === null || v === undefined) return 'NULL';
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            return v;
        });
        sqlDump += 'INSERT INTO public."' + table + '" ("' + columns.join('", "') + '") VALUES (' + values.join(', ') + ');\n';
      }
      sqlDump += '\n';
    }
  }
  fs.writeFileSync('database_dump_part2.sql', sqlDump);
  console.log('done');
}
run();
