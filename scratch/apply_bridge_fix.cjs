const fs = require('fs');
const path = 'c:/Users/HP/OneDrive/Desktop/pulsereview/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                             <div className="h-stack" style={{ gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                               <button className="btn-outline" style={{ border: 'none', color: 'var(--green)', fontSize: 11 }} onClick={() => handleSubthemeAction(sub?.id, 'approve')}>✓ Verify Branch</button>
                               <button className="btn-primary" style={{ background: 'var(--teal)', border: 'none', fontSize: 11, padding: '4px 10px' }} onClick={async () => {
                                 const themeIds = [sub?.id, managerSupplement?.id].filter(Boolean);
                                 if (themeIds.length > 0) {
                                   const { error } = await supabase.from('themes').update({ status: 'pending_director_approval' }).in('id', themeIds);
                                   if (!error) {
                                     showToast("Branch submitted to Satya (Director) for final validation", "var(--purple)");
                                     refreshEmployeeDash();
                                   } else {
                                     showToast("Error submitting to Director", "var(--red)");
                                   }
                                 }
                               }}>Package & Submit to Director →</button>
                             </div>`;

const replacement = `                             <div className="h-stack" style={{ gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                               <button className="btn-outline" style={{ border: 'none', color: 'var(--green)', fontSize: 11 }} onClick={() => handleSubthemeAction(sub?.id, 'approve')}>✓ Verify Branch</button>
                               <button className="btn-primary" style={{ background: 'var(--teal)', border: 'none', fontSize: 11, padding: '4px 10px' }} onClick={async () => {
                                 const themeIds = [sub?.id, managerSupplement?.id].filter(Boolean);
                                 if (themeIds.length > 0) {
                                   const { error } = await supabase.from('themes').update({ status: 'pending_director_approval' }).in('id', themeIds);
                                   if (!error) {
                                     showToast("Branch submitted to Satya (Director) for final validation", "var(--purple)");
                                     refreshEmployeeDash();
                                   } else {
                                     showToast("Error submitting to Director", "var(--red)");
                                   }
                                 }
                               }}>Package & Submit to Director →</button>
                             </div>

                             {activeSubthemeId === rt.id && (
                               <div className="subtheme-form-container" style={{ background: 'rgba(0,178,236,0.02)', padding: 20, borderRadius: 10, border: '1px solid var(--frame-border)', marginTop: 16 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                     <div className="period-label-sm" style={{ color: 'var(--cyan)' }}>SUGGESTED SUPERIOR INPUT</div>
                                     <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13 }} onClick={() => setActiveSubthemeId(null)}>✕ Cancel</button>
                                  </div>
                                  <div className="v-stack" style={{ gap: 12 }}>
                                     <input className="input" placeholder="Title..." value={newDirective.title} onChange={e => setNewDirective({...newDirective, title: e.target.value})} />
                                     <textarea className="input" placeholder="Notes..." value={newDirective.description} onChange={e => setNewDirective({...newDirective, description: e.target.value})} style={{ height: 80 }} />
                                     <button className="btn-primary" style={{ background: 'var(--cyan)', border: 'none' }} onClick={() => handleSubthemeSubmit(rt.id, newDirective)}>Submit Superior Input →</button>
                                  </div>
                               </div>
                             )}`;

// Try exact match first
if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(path, content);
  console.log('Success: Exact match found and replaced.');
} else {
  // Try regex match ignoring whitespace differences
  console.log('Exact match failed. Trying regex...');
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const regex = new RegExp(escapedTarget, 'g');
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content);
    console.log('Success: Regex match found and replaced.');
  } else {
    console.log('Failure: Content not found.');
    process.exit(1);
  }
}
