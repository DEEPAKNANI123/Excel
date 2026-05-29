
import { createClient } from '@supabase/supabase-js';

// URL FROM SCREENSHOT
const supabaseUrl = 'https://zkvuxyggdlsrtkgechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkScreenshotBucket() {
  const { data, error } = await supabase.storage.from('evidence').list('', { limit: 1 });
  if (error && error.message.includes('not found')) {
    console.log(`❌ Bucket 'evidence' NOT FOUND on screenshot URL`);
  } else if (error) {
     console.log(`⚠️ Bucket 'evidence' exists on screenshot URL but restricted (${error.message})`);
  } else {
    console.log(`✅ Bucket 'evidence' EXISTS on screenshot URL`);
  }
}

checkScreenshotBucket();
