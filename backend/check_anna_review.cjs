const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkReviews() {
  try {
    const { rows } = await pool.query("SELECT * FROM monthly_reviews WHERE employee_id = '526cfc04-e8d3-4100-b7d4-c4b155711d0e'");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkReviews();
