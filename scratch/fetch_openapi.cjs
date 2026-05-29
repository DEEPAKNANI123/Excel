require('dotenv').config();
fetch('https://zkvkuxyggdlsrtkqechs.supabase.co/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY)
  .then(r=>r.json())
  .then(j=>console.log("Tables:", Object.keys(j.definitions || j.components?.schemas || {})))
  .catch(console.error);
