const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkApi() {
  try {
    const { rows: alignments } = await pool.query("SELECT * FROM employee_subtheme_alignment");
    const { rows: subthemes } = await pool.query("SELECT * FROM global_subthemes");
    const enriched = alignments.map(a => ({
        ...a, global_subthemes: subthemes.find(s => s.id === a.subtheme_id) || null
    }));
    console.log(JSON.stringify(enriched, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

checkApi();
