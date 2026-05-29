const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAtt() {
  try {
    const { rows } = await pool.query("SELECT attachments FROM monthly_reviews ORDER BY submitted_at DESC NULLS LAST LIMIT 5");
    console.log("Latest 5 attachments:");
    rows.forEach((r, i) => {
      console.log(`[${i}] type: ${typeof r.attachments}, value:`, r.attachments);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkAtt();
