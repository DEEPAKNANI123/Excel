const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(p, 'utf8');

const binaryPanelNew = `// ── BINARY PANEL ──
function BinaryPanel({ member, onClose, onSubmit, showToast, activeUser }) {
  const [sel, setSel] = useState({});
  const [comment, setComment] = useState("");
  function toggle(i, val) { setSel(s => ({ ...s, [i]: s[i] === val ? undefined : val })); }
  const yes = Object.values(sel).filter(v => v === "yes").length;
  const no = Object.values(sel).filter(v => v === "no").length;
  const isYes = yes >= 2;
  
  async function handleSave() {
    if (Object.keys(sel).length < 4) {
      showToast("⚠ Please complete all 4 inputs", "#cf222e");
      return;
    }
    
    // Insert into monthly_reviews
    const payload = {
      employee_id: member.id,
      manager_id: activeUser,
      cycle_id: CYCLE_ID,
      input_contribution: sel[0] === "yes",
      input_collaboration: sel[1] === "yes",
      input_consistency: sel[2] === "yes",
      input_growth: sel[3] === "yes",
      overall_result: isYes ? 'YES' : 'NO',
      manager_comment: comment,
      is_draft: false,
      submitted_at: new Date().toISOString()
    };
    
    // Attempt insert/upsert mapping
    const { error } = await supabase.from('monthly_reviews').upsert(payload, { onConflict: 'employee_id, cycle_id' });
    
    if (error) {
      showToast("Error saving reviews to Supabase", "#cf222e");
      console.error(error);
      return;
    }
    
    onSubmit(member.id, member.name, isYes);
  }

  return (
    <div className="binary-panel">
      <div className="binary-panel-header">
        <div className="emp-left">
          <div className="emp-av" style={{ width: 36, height: 36, fontSize: 12, background: member.color || '#008CC8' }}>{member.name.slice(0,2).toUpperCase()}</div>
          <div><div className="emp-name">{member.name}</div><div className="emp-meta">{member.role} · April 2025</div></div>
        </div>
        <button className="close-btn" onClick={onClose}>✕ Close</button>
      </div>
      <div className="binary-sec-title">4 MONTHLY BINARY INPUTS</div>
      {BINARY_INPUTS.map((inp, i) => (
        <div className="bi-card" key={i}>
          <div><div className="bi-name">{inp.name}</div><div className="bi-sub">{inp.sub}</div></div>
          <div className="bi-btns">
            <button className={\`bi-yes\${sel[i] === "yes" ? " sel" : ""}\`} onClick={() => toggle(i, "yes")}>👍 Yes</button>
            <button className={\`bi-no\${sel[i] === "no" ? " sel" : ""}\`} onClick={() => toggle(i, "no")}>👎 No</button>
          </div>
        </div>
      ))}
      <div className="result-bar">
        <div className="result-count">{yes} Yes · {no} No</div>
        <div>
          <div className="result-auto-lbl">AUTO-CALCULATED RESULT</div>
          {yes + no > 0 ? (isYes ? <span className="yes-b">✓ YES</span> : <span className="no-b">✗ NO</span>) : <span style={{ color: "#8c959f" }}>—</span>}
        </div>
        <div className="result-rule">Rule: 2+ Yes = Overall YES</div>
      </div>
      <div className="form-group">
        <label className="form-label">Manager Comment</label>
        <textarea className="form-textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add context, guidance, or feedback for this employee..." />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-outline" onClick={() => showToast(\`💾 Draft input saved for \${member.name}\`, "#1a7f37")}>Save Draft</button>
        <button className="btn-primary" onClick={handleSave}>Submit Inputs →</button>
      </div>
    </div>
  );
}`;

const managerNew = `// ── MANAGER ──
function Manager({ showToast, activeUser }) {
  const [openPanel, setOpenPanel] = useState(null);
  const [completed, setCompleted] = useState({});
  const [valStatus, setValStatus] = useState({});
  const [team, setTeam] = useState([]);
  const [pendingThemes, setPendingThemes] = useState([]);

  useEffect(() => {
    fetchTeamAndReviews();
    fetchThemesToValidate();
  }, [activeUser]);

  async function fetchTeamAndReviews() {
    const { data: reports } = await supabase.from('profiles').select('*').eq('manager_id', activeUser);
    if (!reports) return;

    const { data: reviews } = await supabase.from('monthly_reviews').select('*').eq('manager_id', activeUser).eq('cycle_id', CYCLE_ID);

    const comp = {};
    const formattedTeam = reports.map((r, i) => {
      const review = reviews?.find(rev => rev.employee_id === r.id);
      if (review && !review.is_draft) {
        comp[r.id] = review.overall_result;
      }
      return {
        id: r.id,
        name: \`\${r.first_name} \${r.last_name}\`,
        role: r.job_title,
        color: ['#008CC8', '#6e40c9', '#e91e63'][i % 3]
      };
    });
    setTeam(formattedTeam);
    setCompleted(comp);
  }
  
  async function fetchThemesToValidate() {
    const { data: themes } = await supabase.from('themes').select('*, profiles!inner(first_name, last_name)').eq('status', 'pending_review');
    if(themes) {
      setPendingThemes(themes);
    }
  }

  async function handleThemeValidation(themeId, statusStr) {
    const { error } = await supabase.from('themes').update({ status: statusStr }).eq('id', themeId);
    if(!error) {
      setValStatus(s => ({ ...s, [themeId]: statusStr }));
      showToast(\`Theme status updated to \${statusStr}\`, "#1a7f37");
    } else {
      showToast("Error updating theme validation", "#cf222e");
    }
  }

  function handleSubmit(id, name, isYes) {
    setCompleted(c => ({ ...c, [id]: isYes ? "YES" : "NO" }));
    setOpenPanel(null);
    showToast(\`✓ Inputs submitted for \${name}\`, "#1a7f37");
  }

  return (
    <div className="page">
      <div className="portal-label">◈ MANAGER PORTAL</div>
      <div className="page-title">Team <span>Reviews</span></div>
      <div className="page-sub">April 2025 · James Okafor · Engineering Lead</div>
      <div className="stats-grid">
        <StatCard cls="blue" label="Direct Reports" val={team.length} />
        <StatCard cls="orange" label="Pending Inputs" val={team.length - Object.keys(completed).length} valCls="orange" />
        <StatCard cls="blue" label="Completed" val={Object.keys(completed).length} valCls="green" />
        <StatCard cls="blue" label="Team YES Rate" val={team.length ? Math.round((Object.values(completed).filter(v => v === "YES").length / Math.max(1, Object.keys(completed).length)) * 100) + "%" : "0%"} />
      </div>
      <Frame>
        <div className="sec-title">Team Monthly Inputs — April 2025</div>
        {team.map(m => (
          <div key={m.id}>
            <div className="member-row">
              <div className="member-av" style={{ background: m.color }}>{m.name.slice(0,2).toUpperCase()}</div>
              <div><div className="member-name">{m.name}</div><div className="member-role">{m.role}</div></div>
              <div className="member-actions">
                {completed[m.id] ? (
                  <><span className={completed[m.id] === "YES" ? "yes-b" : "no-b"}>{completed[m.id]}</span><Badge cls="green" dot>Completed</Badge></>
                ) : (
                  <><Badge cls="yellow" dot>Inputs Needed</Badge><button className="enter-btn" onClick={() => setOpenPanel(openPanel === m.id ? null : m.id)}>Enter Inputs →</button></>
                )}
              </div>
            </div>
            {openPanel === m.id && <BinaryPanel member={m} onClose={() => setOpenPanel(null)} onSubmit={handleSubmit} showToast={showToast} activeUser={activeUser} />}
          </div>
        ))}
      </Frame>
      <Frame className="frame-yellow">
        <div className="sec-title">Theme Validations Pending</div>
        {pendingThemes.length === 0 && <div style={{fontSize: 13, color: '#57606a'}}>No themes pending validation for your direct reports.</div>}
        {pendingThemes.map(v => (
          <div className="val-card" key={v.id}>
            <div className="val-header"><div className="val-name">{v.title}</div>
              {valStatus[v.id] ? <Badge cls={valStatus[v.id] === "approved" ? "green" : valStatus[v.id] === "rejected" ? "red" : "yellow"} dot>{valStatus[v.id]}</Badge> : <Badge cls="yellow" dot>Pending</Badge>}
            </div>
            <div className="val-meta">{v.profiles.first_name} {v.profiles.last_name} · {v.category} · Apr 2025</div>
            {!valStatus[v.id] && (
              <div className="val-btns">
                <button className="vbtn vbtn-a" onClick={() => handleThemeValidation(v.id, 'approved')}>✓ Approve</button>
                <button className="vbtn vbtn-r" onClick={() => handleThemeValidation(v.id, 'returned')}>↵ Return</button>
                <button className="vbtn vbtn-x" onClick={() => handleThemeValidation(v.id, 'rejected')}>✕ Reject</button>
              </div>
            )}
          </div>
        ))}
      </Frame>
    </div>
  );
}`;

content = content.replace(/\/\/ ── BINARY PANEL ──[\s\S]*?\/\/ ── MANAGER ──/, binaryPanelNew + '\n\n// ── MANAGER ──');
content = content.replace(/\/\/ ── MANAGER ──[\s\S]*?\/\/ ── HR ──/, managerNew + '\n\n// ── HR ──');

fs.writeFileSync(p, content);
console.log("App.jsx updated with Manager Supabase implementation.");
