const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkProfiles() {
  try {
    const { rows } = await pool.query("SELECT * FROM profiles WHERE first_name = 'Sarah'");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkProfiles();
