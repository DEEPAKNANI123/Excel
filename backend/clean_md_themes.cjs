const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanThemes() {
  const SATYA_ID = '00000000-0000-0000-0000-000000000001';
  try {
    // 1. Get all themes to see what we have
    const { rows } = await pool.query("SELECT * FROM global_themes");
    console.log("All themes (JSON):");
    console.log(JSON.stringify(rows.map(r => ({ id: r.id, title: r.title, created_by: r.created_by })), null, 2));

    const mdThemes = rows.filter(r => r.created_by === SATYA_ID);
    console.log(`Found ${mdThemes.length} themes for MD.`);

    if (mdThemes.length > 3) {
      const sorted = mdThemes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const idsToDelete = sorted.slice(0, sorted.length - 3).map(r => r.id);
      console.log(`Deleting ${idsToDelete.length} themes...`);

      await pool.query("DELETE FROM global_subthemes WHERE theme_id = ANY($1)", [idsToDelete]);
      const result = await pool.query("DELETE FROM global_themes WHERE id = ANY($1)", [idsToDelete]);
      console.log(`Successfully deleted ${result.rowCount} themes.`);
    }
  } catch (err) {
    console.error("Error cleaning themes:", err);
  } finally {
    await pool.end();
  }
}

cleanThemes();
