import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

const appIndex = code.indexOf('// ── APP ──');
if (appIndex === -1) throw new Error("Could not find App marker");

let headCode = code.slice(0, appIndex);

// Add react-router imports at top if missing
if (!headCode.includes('import { useLocation, useNavigate } from "react-router-dom"')) {
   headCode = headCode.replace(
      'import { useState, useEffect, useRef } from "react";',
      'import { useState, useEffect, useRef } from "react";\nimport { useLocation, useNavigate } from "react-router-dom";'
   );
}

const replacement = `// ── APP ──
export default function App() {
  const [page, setPage] = useState("overview");
  const [role, setRole] = useState("Employee");
  const [activeUser, setActiveUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", color: "#1a7f37" });
  const timerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
         navigate("/");
         return;
      }
      
      const { data: profileData } = await supabase.from('profiles').select('*').eq('auth_email', session.user.email).single();
      
      if (!profileData) {
        return;
      }

      setProfile(profileData);
      setActiveUser(profileData.id);
      
      if (profileData.role === 'employee') {
        setPage('employee');
        setRole('Employee');
      } else if (profileData.role === 'manager') {
        setPage('manager');
        setRole('Manager');
      }
    }
    
    initSession();
  }, []);

  function showToast(msg, color = "#1a7f37") {
    setToast({ show: true, msg, color });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  function handleRole(r) {
    if (profile?.role === 'employee' && r === 'Manager') {
       showToast("Access Denied", "#cf222e");
       return;
    }
    setRole(r);
    setPage(r.toLowerCase());
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const ALL_TABS = [["overview","◆ Overview"],["employee","○ Employee"],["manager","◈ Manager"],["themes","◈ Themes"]];
  const TABS = profile?.role === 'employee' 
      ? ALL_TABS.filter(t => t[0] !== 'manager') 
      : ALL_TABS;

  if (!activeUser) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Session...</div>;

  return (
    <>
      <style>{css}</style>
      <div className="pr-wrap">
        <nav className="nav">
          <div className="nav-logo" onClick={() => setPage("overview")}><div className="nav-dot" /><span>PulseReview</span></div>
          <div className="nav-tabs">
            {TABS.map(([id, label]) => <button key={id} className={\`nav-tab\${page === id ? " active" : ""}\`} onClick={() => setPage(id)}>{label}</button>)}
          </div>
          <div className="nav-right">
            <div className="role-btns">
              <button className={\`role-btn\${role === "Employee" ? " active" : ""}\`} onClick={() => handleRole("Employee")}>Employee</button>
              {profile?.role === 'manager' && (
                <button className={\`role-btn\${role === "Manager" ? " active" : ""}\`} onClick={() => handleRole("Manager")}>Manager</button>
              )}
            </div>
            <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {profile ? \`\${profile.first_name} \${profile.last_name}\` : "User"} 
              <div className="avatar">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #d0d7de', borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: '#cf222e' }}>Logout</button>
            </div>
          </div>
        </nav>
        {page === "overview" && <Overview />}
        {page === "employee" && <Employee showToast={showToast} activeUser={activeUser} />}
        {page === "manager" && <Manager showToast={showToast} activeUser={activeUser} />}
        {page === "themes" && <Themes />}
        <Toast msg={toast.msg} color={toast.color} show={toast.show} />
      </div>
    </>
  );
}
`;

fs.writeFileSync('src/App.jsx', headCode + replacement);
console.log("App.jsx refactored successfully.");
