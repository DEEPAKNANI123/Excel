const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Add Supabase import
content = content.replace(
  'import { useState, useEffect, useRef } from "react";',
  `import { useState, useEffect, useRef } from "react";\nimport { supabase } from "./supabaseClient";\n\nconst CYCLE_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';`
);

// 2. Rewrite Employee function
const employeeNew = `// ── EMPLOYEE ──
function Employee({ showToast, activeUser }) {
  const [themes, setThemes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", cat: "Delivery Quality", desc: "", link: "", evidence: "" });

  useEffect(() => {
    fetchThemes();
  }, [activeUser]);

  async function fetchThemes() {
    const { data, error } = await supabase.from('themes').select('*').eq('employee_id', activeUser);
    if (data) setThemes(data);
  }

  async function submitTheme() {
    if (!form.title.trim()) { showToast("⚠ Please enter a theme title", "#9a6700"); return; }
    if (!form.desc.trim()) { showToast("⚠ Please add a short description", "#9a6700"); return; }
    
    const newTheme = {
      employee_id: activeUser,
      cycle_id: CYCLE_ID,
      title: form.title,
      category: form.cat,
      description: form.desc,
      linked_objective: form.link,
      achievement_evidence: form.evidence,
      status: 'pending_review'
    };
    
    const { error } = await supabase.from('themes').insert([newTheme]);
    
    if (error) {
      showToast("Error saving theme", "#cf222e");
      console.error(error);
      return;
    }
    
    fetchThemes();
    setForm({ title: "", cat: "Delivery Quality", desc: "", link: "", evidence: "" });
    setShowForm(false);
    showToast("✓ Theme submitted for manager review", "#1a7f37");
  }

  return (
    <div className="page">
      <div className="portal-label">○ EMPLOYEE PORTAL</div>
      <div className="page-title">My <span>Monthly Review</span></div>
      <div className="page-sub">April 2025 · Sarah Mitchell · Frontend Developer</div>
      <div className="emp-profile">
        <div className="emp-left"><div className="emp-av">SM</div><div><div className="emp-name">Sarah Mitchell</div><div className="emp-meta">EMP-12345 · Frontend Developer · Manager: James Okafor</div></div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Badge cls="yellow" dot>In Progress</Badge>
          <div><div className="period-lbl">Review Period</div><div className="period-v">APR 2025</div></div>
        </div>
      </div>
      <Frame className="frame-blue">
        <div className="sec-title">My Themes — April 2025</div>
        <div className="theme-notice"><span style={{ color: "#00B2EC" }}>ℹ</span> Your line manager has directed themes for this cycle: Delivery Quality, Stakeholder Collaboration, Technical Initiative</div>
        {themes.map((t) => (
          <ThemeCard key={t.id} name={t.title} cat={t.category} desc={t.description} status={t.status} statusCls={t.status === 'approved' ? 'green' : 'yellow'} />
        ))}
        {!showForm && <button className="add-theme-btn" onClick={() => setShowForm(true)}>+ Add New Theme</button>}
        {showForm && (
          <div className="new-theme-form">
            <div className="new-theme-title">NEW THEME ENTRY</div>
            <div className="form-row">
              <div><label className="form-label">Theme Title</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. React Component Library Upgrade" /></div>
              <div><label className="form-label">Category</label>
                <select className="form-select" value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                  {["Delivery Quality", "Stakeholder Collaboration", "Technical Initiative", "Process Improvement", "Leadership & Mentoring"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Short Description</label><textarea className="form-textarea" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Describe what you did, the approach, and the outcome..." /></div>
            <div className="form-row" style={{ marginBottom: 20 }}>
              <div><label className="form-label">Link to Objective / Task / Project</label><input className="form-input" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="e.g. OKR-2025-Q2-07" /></div>
              <div><label className="form-label">Achievement Evidence</label><input className="form-input" value={form.evidence} onChange={e => setForm({ ...form, evidence: e.target.value })} placeholder="e.g. Reduced build time by 40%" /></div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={submitTheme}>Submit Theme →</button>
            </div>
          </div>
        )}
      </Frame>
      <div className="action-row">
        <button className="btn-outline" onClick={() => showToast("💾 Draft saved successfully", "#1a7f37")}>💾 Save Draft</button>
        <button className="btn-primary" onClick={() => showToast("✓ Review submitted to James Okafor", "#1a7f37")}>Submit for Review →</button>
      </div>
    </div>
  );
}`;

content = content.replace(/\/\/ ── EMPLOYEE ──[\s\S]*?\/\/ ── BINARY PANEL ──/, employeeNew + '\n\n// ── BINARY PANEL ──');

// 3. Update App component with activeUser passed to child components
content = content.replace(
  'const [role, setRole] = useState("Manager");',
  `const [role, setRole] = useState("Manager");\n  const activeUser = role === "Employee" ? 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' : 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';`
);

content = content.replace(
  '<Employee showToast={showToast} />',
  '<Employee showToast={showToast} activeUser={activeUser} />'
);

content = content.replace(
  '<Manager showToast={showToast} />',
  '<Manager showToast={showToast} activeUser={activeUser} />'
);

fs.writeFileSync(p, content);
console.log("App.jsx updated with Employee Supabase implementation.");
