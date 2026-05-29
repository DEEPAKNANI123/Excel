const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkConstraints() {
  try {
    const { rows } = await pool.query(`
      SELECT 
        conname AS constraint_name, 
        contype AS constraint_type 
      FROM pg_constraint 
      WHERE conrelid = 'monthly_reviews'::regclass;
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkConstraints();
