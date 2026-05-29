const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkSubtheme() {
  try {
    const { rows } = await pool.query("SELECT * FROM global_subthemes WHERE id = '286e9d90-9634-4fbc-9a3a-469f7f2d0ea8'");
    console.log("Subtheme:", JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkSubtheme();
