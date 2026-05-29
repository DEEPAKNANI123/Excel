const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(p, 'utf8');

const MDT_COMPONENT = `// ── MANAGER DIRECTED THEMES ──
function ManagerDirectThemes({ activeUser, showToast }) {
  const [team, setTeam] = useState([]);
  const [directions, setDirections] = useState({});

  useEffect(() => {
    fetchTeamDirections();
  }, [activeUser]);

  async function fetchTeamDirections() {
    const { data: reports } = await supabase.from('profiles').select('*').eq('manager_id', activeUser);
    if (!reports) return;

    const { data: dirs } = await supabase.from('manager_directions').select('*').eq('cycle_id', CYCLE_ID);
    
    const dirsMap = {};
    if (dirs) {
       dirs.forEach(d => {
         dirsMap[d.employee_id] = d.directed_themes;
       });
    }

    setTeam(reports.map(r => ({
      id: r.id,
      name: \`\${r.first_name} \${r.last_name}\`,
      role: r.job_title
    })));
    setDirections(dirsMap);
  }

  async function handleToggleTheme(empId, themeStr) {
    const current = directions[empId] || [];
    let next;
    if(current.includes(themeStr)) next = current.filter(t => t !== themeStr);
    else next = [...current, themeStr];

    setDirections(prev => ({...prev, [empId]: next}));
  }

  async function saveDirections(empId, empName) {
    const themes = directions[empId] || [];
    const payload = {
       employee_id: empId,
       cycle_id: CYCLE_ID,
       directed_themes: themes
    };
    const { error } = await supabase.from('manager_directions').upsert(payload, { onConflict: 'employee_id, cycle_id' });
    if (error) {
       showToast("Error saving directions", "#cf222e");
       console.error(error);
    } else {
       showToast(\`✓ Directed themes saved for \${empName}\`, "#1a7f37");
    }
  }

  const CATS = ["Delivery Quality", "Stakeholder Collaboration", "Technical Initiative", "Process Improvement", "Leadership & Mentoring"];

  return (
    <div style={{ paddingTop: 16 }}>
      <Frame>
        <div className="sec-title">Assign Directed Themes to Direct Reports</div>
        <div className="theme-notice"><span style={{ color: "#00B2EC" }}>ℹ</span> Select the core focus areas for each direct report for this cycle.</div>
        {team.length === 0 && <div style={{ fontSize: 13, color: '#57606a' }}>You do not have any employees tagged under you.</div>}
        {team.map(m => (
          <div key={m.id} style={{ padding: "16px 0", borderBottom: "1px solid #e1e4e8", borderBottomStyle: team[team.length-1].id === m.id ? 'none' : 'solid' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{m.name} <span style={{ fontWeight: 400, color: "#57606a" }}>({m.role})</span></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {CATS.map(c => {
                 const active = (directions[m.id] || []).includes(c);
                 return (
                   <button key={c} onClick={() => handleToggleTheme(m.id, c)} style={{ padding: "4px 10px", borderRadius: 12, border: \`1px solid \${active ? '#00B2EC' : '#d0d7de'}\`, background: active ? '#f0faff' : '#f6f8fa', color: active ? '#00B2EC' : '#57606a', fontSize: 12, cursor: 'pointer' }}>
                     {active ? '✓ ' : '+ '} {c}
                   </button>
                 )
              })}
            </div>
            <button className="btn-outline" style={{ fontSize: 12, padding: "4px 12px" }} onClick={() => saveDirections(m.id, m.name)}>Save Themes for {m.name}</button>
          </div>
        ))}
      </Frame>
    </div>
  );
}

// ── EMPLOYEE ──`;

content = content.replace('// ── EMPLOYEE ──', MDT_COMPONENT);

// Modify Employee component internals
content = content.replace(
  `const [form, setForm] = useState({ title: "", cat: "Delivery Quality", desc: "", link: "", evidence: "" });`,
  `const [form, setForm] = useState({ title: "", cat: "Delivery Quality", desc: "", link: "", evidence: "" });
  const [empTab, setEmpTab] = useState('My Review');
  const [myDirectedThemes, setMyDirectedThemes] = useState([]);
  const [hasSubordinates, setHasSubordinates] = useState(false);`
);

content = content.replace(
  `useEffect(() => {
    fetchThemes();
  }, [activeUser]);`,
  `useEffect(() => {
    fetchThemes();
    checkSubordinates();
    fetchMyDirections();
  }, [activeUser]);

  async function checkSubordinates() {
    const { data } = await supabase.from('profiles').select('id').eq('manager_id', activeUser).limit(1);
    setHasSubordinates(data && data.length > 0);
  }

  async function fetchMyDirections() {
    const { data } = await supabase.from('manager_directions').select('*').eq('employee_id', activeUser).eq('cycle_id', CYCLE_ID).maybeSingle();
    if (data && data.directed_themes) {
       setMyDirectedThemes(data.directed_themes);
    } else {
       setMyDirectedThemes([]);
    }
  }`
);

// Replace Employee Render Header
const employeeHeaderTarget = `<div className="page-title">My <span>Monthly Review</span></div>
      <div className="page-sub">April 2025 · Sarah Mitchell · Frontend Developer</div>
      <div className="emp-profile">`;

const employeeHeaderReplacement = `<div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>My <span>Monthly Review</span></div>
        {hasSubordinates && (
          <div className="role-btns">
             {["My Review", "Subordinate Themes"].map(t => (
               <button key={t} className={\`role-btn\${empTab === t ? " active" : ""}\`} onClick={() => setEmpTab(t)}>{t}</button>
             ))}
          </div>
        )}
      </div>
      <div className="page-sub">April 2025 · Sarah Mitchell · Frontend Developer</div>
      {empTab === 'My Review' ? (
      <>
      <div className="emp-profile">`;

content = content.replace(employeeHeaderTarget, employeeHeaderReplacement);

// Replace Theme Notice
content = content.replace(
  `<div className="theme-notice"><span style={{ color: "#00B2EC" }}>ℹ</span> Your line manager has directed themes for this cycle: Delivery Quality, Stakeholder Collaboration, Technical Initiative</div>`,
  `<div className="theme-notice">
    <span style={{ color: "#00B2EC" }}>ℹ</span> 
    {myDirectedThemes.length > 0 ? \` Your line manager has directed themes for this cycle: \${myDirectedThemes.join(', ')}\`
    : \` You have no directed themes from your manager yet for this cycle.\`}
  </div>`
);

// Close out the tab toggle
const employeeEndTarget = `      <div className="action-row">
        <button className="btn-outline" onClick={() => showToast("💾 Draft saved successfully", "#1a7f37")}>💾 Save Draft</button>
        <button className="btn-primary" onClick={() => showToast("✓ Review submitted to James Okafor", "#1a7f37")}>Submit for Review →</button>
      </div>
    </div>
  );
}`;

const employeeEndReplacement = `      <div className="action-row">
        <button className="btn-outline" onClick={() => showToast("💾 Draft saved successfully", "#1a7f37")}>💾 Save Draft</button>
        <button className="btn-primary" onClick={() => showToast("✓ Review submitted to James Okafor", "#1a7f37")}>Submit for Review →</button>
      </div>
      </>
      ) : (
        <ManagerDirectThemes activeUser={activeUser} showToast={showToast} />
      )}
    </div>
  );
}`;

content = content.replace(employeeEndTarget, employeeEndReplacement);

// Manager Empty State
const managerTitleTarget = `<div className="page-title">Team <span>Reviews</span></div>
      <div className="page-sub">April 2025 · James Okafor · Engineering Lead</div>`;
const managerTitleReplacement = `<div className="page-title">Team <span>Reviews</span></div>
      <div className="page-sub">April 2025 · James Okafor · Engineering Lead</div>
      {team.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderRadius: 12, border: "1px dashed #d0d7de", marginTop: 24 }}>
           <h3 style={{ fontSize: 16, color: "#24292f", marginBottom: 8 }}>You do not have any employees tagged under you</h3>
           <p style={{ color: "#57606a", fontSize: 14 }}>This portal is only active for Line Managers and Executives with direct reports.</p>
        </div>
      ) : (
        <>`;

const managerEndTarget = `    </div>
  );
}`;
const managerEndReplacement = `        </>
      )}
    </div>
  );
}`;

content = content.replace(managerTitleTarget, managerTitleReplacement);
content = content.replace('// ── HR ──', managerEndReplacement + '\\n\\n// ── HR ──');

fs.writeFileSync(p, content);
console.log("App.jsx heavily refactored for new Employee Tabs and Manager empty state.");
