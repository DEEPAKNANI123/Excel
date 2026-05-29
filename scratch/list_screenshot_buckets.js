
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkvuxyggdlsrtkgechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.log('Error listing buckets on screenshot URL:', error.message);
  } else {
    console.log('Available buckets on screenshot URL:', data);
  }
}

listAll();
