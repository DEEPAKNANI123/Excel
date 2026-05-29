const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function seedApril() {
  try {
    console.log("Seeding April data for testing...");
    
    // Sarah Jenkins
    await pool.query(`
      UPDATE monthly_reviews 
      SET submitted_at = '2026-04-15T10:00:00Z', 
          overall_result = 'YES', 
          rating_status = 'APPROVED',
          cycle_id = 'APR_2026'
      WHERE id = '312b220d-731c-42c3-aabd-a7ed2ad0201e'
    `);

    // Tessa Thompson
    const { rows: tessaReviews } = await pool.query(`
      SELECT id FROM monthly_reviews 
      WHERE employee_id IN (SELECT id FROM profiles WHERE first_name = 'Tessa')
      LIMIT 1
    `);
    
    if (tessaReviews[0]) {
       await pool.query(`
         UPDATE monthly_reviews 
         SET submitted_at = '2026-04-12T14:30:00Z', 
             overall_result = 'NO', 
             rating_status = 'APPROVED',
             cycle_id = 'APR_2026'
         WHERE id = $1
       `, [tessaReviews[0].id]);
    }

    console.log("Successfully seeded April data for Sarah and Tessa.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

seedApril();
