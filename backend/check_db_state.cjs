const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
});

async function run() {
  try {
    const { rows } = await pool.query('SELECT * FROM global_subthemes ORDER BY created_at DESC LIMIT 5');
    console.log('Last 5 subthemes:');
    console.log(JSON.stringify(rows, null, 2));

    const { rows: alignments } = await pool.query('SELECT * FROM employee_subtheme_alignment ORDER BY created_at DESC LIMIT 5');
    console.log('Last 5 alignments:');
    console.log(JSON.stringify(alignments, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
