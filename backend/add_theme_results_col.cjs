const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addCol() {
  try {
    console.log("Checking columns...");
    const { rows: cols } = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'monthly_reviews'");
    const columnNames = cols.map(r => r.column_name);
    console.log("Current columns:", columnNames);

    if (!columnNames.includes('theme_results')) {
      console.log("Adding theme_results column...");
      await pool.query("ALTER TABLE monthly_reviews ADD COLUMN theme_results JSONB");
      console.log("Successfully added theme_results column.");
    } else {
      console.log("theme_results column already exists.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

addCol();
