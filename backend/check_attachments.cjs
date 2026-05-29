const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAtt() {
  try {
    const { rows: cols } = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'monthly_reviews' AND column_name = 'attachments'");
    console.log("Column type:", cols[0]?.data_type);

    const { rows } = await pool.query("SELECT attachments FROM monthly_reviews LIMIT 5");
    console.log("First 5 attachments:", rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkAtt();
