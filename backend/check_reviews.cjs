const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkReviews() {
  try {
    const { rows: profiles } = await pool.query("SELECT id, first_name, last_name FROM profiles WHERE first_name IN ('Sarah', 'Tessa', 'David')");
    console.log("Profiles:", profiles);

    const ids = profiles.map(p => p.id);
    if (ids.length > 0) {
      const { rows: reviews } = await pool.query("SELECT id, employee_id, cycle_id, submitted_at, overall_result FROM monthly_reviews WHERE employee_id = ANY($1)", [ids]);
      console.log("Reviews:", JSON.stringify(reviews, null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkReviews();
