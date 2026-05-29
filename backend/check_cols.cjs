const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkCols() {
  try {
    const { rows: cols } = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name ILIKE '%password%'");
    console.log(JSON.stringify(cols, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkCols();
