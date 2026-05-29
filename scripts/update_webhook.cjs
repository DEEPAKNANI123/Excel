const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(p, 'utf8');

const targetStr = `const { error } = await supabase.from('themes').insert([newTheme]);
    
    if (error) {
      showToast("Error saving theme", "#cf222e");
      console.error(error);
      return;
    }`;

const replacementStr = `const { error } = await supabase.from('themes').insert([newTheme]);
    
    if (error) {
      showToast("Error saving theme", "#cf222e");
      console.error(error);
      return;
    }

    try {
      // Fetch employee profile details to send via webhook
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', activeUser).single();
      
      if (profile) {
        await fetch('https://soxibetahr.app.n8n.cloud/webhook/review-submitted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee: profile,
            theme: newTheme
          })
        });
      }
    } catch (err) {
      console.error("Webhook trigger failed:", err);
    }`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(p, content);
console.log("App.jsx updated with Webhook integration.");
