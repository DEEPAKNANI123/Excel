const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
});

async function checkData() {
  try {
    const { rows: subthemes } = await pool.query('SELECT * FROM global_subthemes ORDER BY id DESC LIMIT 1');
    const latest = subthemes[0];
    console.log("LATEST SUBTHEME:", JSON.stringify(latest, null, 2));

    if (latest) {
      const { rows: alignments } = await pool.query('SELECT * FROM employee_subtheme_alignment WHERE subtheme_id = $1', [latest.id]);
      console.log("\nALIGNMENTS FOR LATEST SUBTHEME:", JSON.stringify(alignments, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkData();
