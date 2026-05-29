const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Replace handleAssignToEmployee block
const assignSearch = /async function handleAssignToEmployee\(\) \{[\s\S]*?async function handleManagerSubthemeSubmit/;
// Wait, I need to find the exact end of handleManagerSubthemeSubmit too.

const fullLogicSearch = /async function handleAssignToEmployee\(\) \{[\s\S]*?async function handleSubmit\(e\) \{/;
const newLogicReplace = `async function handleAssignToEmployee() {
    if (selectedEmpIds.length === 0 || !newDirective.title) return;
    
    const inserts = selectedEmpIds.map(id => ({
      title: newDirective.title,
      description: newDirective.description,
      category: newDirective.category,
      employee_id: id,
      assigned_by: activeUser,
      assigned_to: id,
      cycle_id: CYCLE_ID,
      status: 'assigned'
    }));

    const { error } = await supabase.from('themes').insert(inserts);

    if (!error) {
       showToast(\`Directive delegated to \${selectedEmpIds.length} team members\`, "var(--cyan)");
       setShowCreator(false);
       setSelectedEmpIds([]);
       setNewDirective({ title: "", description: "", category: "Delivery Quality" });
       refreshEmployeeDash();
    } else {
       showToast("Error delegating directive", "#cf222e");
    }
  }

  async function handleSubmit(e) {`;

if (fullLogicSearch.test(content)) {
    content = content.replace(fullLogicSearch, newLogicReplace);
}

// 2. Clean up Authority Console (Remove override buttons)
// Anchor: Badge cls="teal"
const authorityConsoleSearch = /<div className="h-stack" style=\{\{ gap: 8 \}\}>[\s\S]*?<Badge cls="teal" dot>\{reflections\.length > 0 \? "Progress Logged" : "Tracking"\}<\/Badge>[\s\S]*?<\/div>/g;
const authorityConsoleReplace = `<Badge cls="teal" dot>{reflections.length > 0 ? "Progress Logged" : "Tracking"}</Badge>`;

content = content.replace(authorityConsoleSearch, authorityConsoleReplace);

// 3. Remove the Edit logic from the subthemes list
const subthemeOverrideSearch = /<React\.Fragment key=\{r\.id\}>[\s\S]*?EDIT SUBTHEME<\/button>[\s\S]*?<\/React\.Fragment>/g;
const subthemeOverrideReplace = `<div key={r.id} style={{ marginLeft: 24, padding: '8px 12px', background: 'rgba(0,178,236,0.02)', borderLeft: '3px solid var(--purple)', borderRadius: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--purple)', marginBottom: 4 }}>MONTHLY SUBTHEME</div>
                        <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{r.description}</div>
                      </div>`;

content = content.replace(subthemeOverrideSearch, subthemeOverrideReplace);

// 4. Update Selection UI (Assignment Panel)
const assignmentPanelSearch = /<div className="v-stack">[\s\S]*?1\. SELECTION \(SEARCH REPORT\)[\s\S]*?Delegate Directive to \{selectedEmp \? selectedEmp\.first_name : "selected report"\} →[\s\S]*?<\/button>/;
const assignmentPanelReplace = `<div className="v-stack">
                    <label className="form-label" style={{ color: 'var(--cyan)' }}>1. SELECTION (TEAM MEMBERS)</label>
                    <div className="h-stack" style={{ gap: 8, marginBottom: 8 }}>
                       <input className="input" placeholder="Search by name..." value={empSearch} onChange={e => setEmpSearch(e.target.value)} style={{ flex: 1 }} />
                       <button className="badge badge-gray" style={{ cursor: 'pointer', border: 'none' }} onClick={() => {
                          const allIds = team.map(m => m.id);
                          setSelectedEmpIds(selectedEmpIds.length === allIds.length ? [] : allIds);
                       }}>
                          {selectedEmpIds.length === team.length ? "Deselect All" : "Select All"}
                       </button>
                    </div>
                    <div className="search-results" style={{ maxHeight: 120, overflowY: 'auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4 }}>
                       {team.filter(e => \`\${e.first_name} \${e.last_name}\`.toLowerCase().includes(empSearch.toLowerCase())).map(e => (
                         <div key={e.id} className="member-row" style={{ padding: '8px 12px', cursor: 'pointer', background: selectedEmpIds.includes(e.id) ? 'rgba(0,178,236,0.1)' : 'transparent', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => {
                            setSelectedEmpIds(prev => prev.includes(e.id) ? prev.filter(id => id !== e.id) : [...prev, e.id]);
                         }}>
                            <div className={\`checkbox-circle \${selectedEmpIds.includes(e.id) ? 'checked' : ''}\`} />
                            <div className="v-stack">
                               <div style={{ fontSize: 13, fontWeight: 700 }}>\${e.first_name} \${e.last_name}</div>
                               <div style={{ fontSize: 11, color: 'var(--text3)' }}>\${e.job_title}</div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="v-stack">
                    <label className="form-label" style={{ color: 'var(--cyan)' }}>2. DIRECTIVE DEFINITION</label>
                    <div className="v-stack" style={{ gap: 10 }}>
                       <input className="input" placeholder="Strategic Goal Title..." value={newDirective.title} onChange={e => setNewDirective({...newDirective, title: e.target.value})} />
                       <textarea className="input" placeholder="Goal Description & Strategic Context..." value={newDirective.description} onChange={e => setNewDirective({...newDirective, description: e.target.value})} style={{ height: 60 }} />
                       <select className="input" value={newDirective.category} onChange={e => setNewDirective({...newDirective, category: e.target.value})}>
                          <option>Delivery Quality</option>
                          <option>Stakeholder Collaboration</option>
                          <option>Technical Initiative</option>
                          <option>Growth & Innovation</option>
                       </select>
                    </div>
                 </div>
              </div>
              <button className="btn-primary" style={{ width: '100%', marginTop: 16, background: 'var(--cyan)', border: 'none' }} disabled={selectedEmpIds.length === 0 || !newDirective.title} onClick={handleAssignToEmployee}>
                 Delegate Strategic Role to \${selectedEmpIds.length} staff member(s) →
              </button>`;

content = content.replace(assignmentPanelSearch, assignmentPanelReplace);

// Final Cleanup of any remaining managerSubthemeForm / editingSubthemeId if necessary (already removed in state chunk)

fs.writeFileSync(targetFile, content);
console.log("Roadmap realignment script complete.");
