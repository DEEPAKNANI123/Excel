import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkTables() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1)
  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Profiles table exists. Columns:', Object.keys(data[0] || {}))
  }

  const tables = ['global_themes', 'global_subthemes', 'employee_subtheme_alignment', 'monthly_reviews']
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`Table ${table} missing or inaccessible:`, error.message)
    } else {
      console.log(`Table ${table} OK`)
    }
  }
}

checkTables()
