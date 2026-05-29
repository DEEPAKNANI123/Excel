const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixDB() {
  try {
    await pool.query("UPDATE monthly_reviews SET attachments = '[]' WHERE attachments = '[object Object]'");
    console.log("Fixed DB rows");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

fixDB();
