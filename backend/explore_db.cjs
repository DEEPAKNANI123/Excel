const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const { rows: tables } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("TABLES:", tables.map(t => t.table_name).join(", "));
    
    for (const t of tables) {
      const { rows: cols } = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t.table_name}'`);
      console.log(`COLUMNS FOR ${t.table_name}:`, cols.map(c => c.column_name).join(", "));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
