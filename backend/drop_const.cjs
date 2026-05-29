const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function alterTable() {
  try {
    // Drop the unique constraint
    await pool.query(`ALTER TABLE monthly_reviews DROP CONSTRAINT IF EXISTS monthly_reviews_employee_id_cycle_id_key`);
    console.log("Constraint dropped.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

alterTable();
