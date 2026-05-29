const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkCols() {
  try {
    const { rows } = await pool.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'monthly_reviews'");
    console.log(rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkCols();
