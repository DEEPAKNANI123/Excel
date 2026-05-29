const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update Authority Console parent theme card
const parentThemeSearch = '<Badge cls="teal" dot>{reflections.length > 0 ? "Progress Logged" : "Tracking"}</Badge>';
const parentThemeReplace = `<div className="h-stack" style={{ gap: 8 }}>
                          <button className="badge badge-teal" style={{ cursor: 'pointer', border: 'none' }} onClick={() => {
                            setEditingSubthemeId(\`new-\${tt.id}\`);
                            setManagerSubthemeForm({ achievements: "", blockers: "", learning: "" });
                          }}>+ Add Subtheme</button>
                          <Badge cls="teal" dot>{reflections.length > 0 ? "Progress Logged" : "Tracking"}</Badge>
                       </div>`;

if (content.includes(parentThemeSearch)) {
  content = content.replace(parentThemeSearch, parentThemeReplace);
}

// 2. Update Authority Console subtheme list (using a unique multi-line anchor)
const subthemeSearch = `{reflections.map(r => (
                      <div key={r.id} style={{ marginLeft: 24, padding: '8px 12px', background: 'rgba(0,178,236,0.02)', borderLeft: '3px solid var(--purple)', borderRadius: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', marginBottom: 4 }}>MONTHLY SUBTHEME</div>
                        <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{r.description}</div>
                      </div>
                    ))}`;

const subthemeReplace = `{reflections.map(r => (
                      <React.Fragment key={r.id}>
                        <div className="v-stack" style={{ marginLeft: 24, padding: '12px', background: 'rgba(0,178,236,0.02)', borderLeft: '3px solid var(--purple)', borderRadius: "0 4px 4px 0", gap: 8 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)' }}>MONTHLY SUBTHEME</div>
                             <button style={{ background: 'none', border: 'none', color: 'var(--purple)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} onClick={() => {
                               setEditingSubthemeId(r.id);
                               const lines = r.description.split('\\n');
                               setManagerSubthemeForm({
                                 achievements: lines[0]?.replace('Achievements: ', '') || "",
                                 blockers: lines[1]?.replace('Blockers: ', '') || "",
                                 learning: lines[2]?.replace('Learning: ', '') || ""
                               });
                             }}>EDIT SUBTHEME</button>
                           </div>
                           <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{r.description}</div>
                        </div>
                        {editingSubthemeId === r.id && (
                           <div style={{ marginLeft: 24, padding: 16, background: 'var(--bg2)', borderRadius: 4, border: '1px solid var(--purple)' }}>
                             <EvidenceBox 
                                themeId={r.id} 
                                evidence={managerSubthemeForm} 
                                updateEvidence={(id, f, v) => setManagerSubthemeForm({...managerSubthemeForm, [f]: v})}
                                readonly={false}
                                onReflectionSubmit={() => handleManagerSubthemeSubmit(tt.id, r.id)}
                             />
                           </div>
                        )}
                      </React.Fragment>
                    ))}

                    {editingSubthemeId === \`new-\${tt.id}\` && (
                      <div style={{ marginLeft: 24, padding: 16, background: 'var(--bg2)', borderRadius: 4, border: '1px solid var(--purple)' }}>
                         <div className="period-label-sm" style={{ color: 'var(--purple)', marginBottom: 12 }}>ADD SUBTHEME ON BEHALF OF REPORT</div>
                         <EvidenceBox 
                            themeId={tt.id} 
                            evidence={managerSubthemeForm} 
                            updateEvidence={(id, f, v) => setManagerSubthemeForm({...managerSubthemeForm, [f]: v})}
                            readonly={false}
                            onReflectionSubmit={() => handleManagerSubthemeSubmit(tt.id)}
                         />
                         <button className="btn-outline" style={{ width: '100%', marginTop: 8 }} onClick={() => setEditingSubthemeId(null)}>Cancel</button>
                      </div>
                    )}`;

if (content.includes(subthemeSearch)) {
  content = content.replace(subthemeSearch, subthemeReplace);
}

fs.writeFileSync(targetFile, content);
console.log("Roadmap UI changes applied successfully.");
