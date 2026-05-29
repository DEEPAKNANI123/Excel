const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    console.log("Adding password_hash column...");
    await pool.query("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT");
    
    console.log("Fetching users...");
    const { rows: users } = await pool.query("SELECT id, employee_id FROM profiles WHERE password_hash IS NULL");
    
    console.log(`Populating passwords for ${users.length} users...`);
    for (const user of users) {
      // Set default password to employee_id (e.g., EMP020)
      const hashedPassword = await bcrypt.hash(user.employee_id || 'password123', 10);
      await pool.query("UPDATE profiles SET password_hash = $1 WHERE id = $2", [hashedPassword, user.id]);
    }
    
    console.log("Schema fix completed successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
