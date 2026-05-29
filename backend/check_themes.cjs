const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

async function checkData() {
  try {
    const { rows: themes } = await pool.query('SELECT id, title, is_active FROM global_themes');
    console.log("ALL THEMES:");
    console.log(JSON.stringify(themes, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkData();
