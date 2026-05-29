
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkvkuxyggdlsrtkqechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function probeBuckets() {
  const buckets = ['evidence', 'avatars', 'public', 'files', 'storage', 'data'];
  for (const b of buckets) {
    const { data, error } = await supabase.storage.from(b).list('', { limit: 1 });
    if (error && error.message.includes('not found')) {
      console.log(`❌ Bucket '${b}' NOT FOUND`);
    } else if (error) {
       console.log(`⚠️ Bucket '${b}' exists but restricted (${error.message})`);
    } else {
      console.log(`✅ Bucket '${b}' EXISTS`);
    }
  }
}

probeBuckets();
