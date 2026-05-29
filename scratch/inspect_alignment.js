
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zkvkuxyggdlsrtkqechs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inprdmt1eHlnZ2Rsc3J0a3FlY2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTI1NDMsImV4cCI6MjA5MzEyODU0M30.oOKqO3YTonWxlaNfegGaYmXKuigfliiHSa3byGskzR4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAlignment() {
  const { data, error } = await supabase.from('employee_subtheme_alignment').select('*').limit(1);
  if (error) {
    console.error('Error inspecting alignment:', error);
  } else {
    console.log('Columns in employee_subtheme_alignment:', Object.keys(data[0] || {}));
  }
}

inspectAlignment();
