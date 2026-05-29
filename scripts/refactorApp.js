import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

const target = `// ── APP ──
export default function App() {
  const [page, setPage] = useState("overview");
  const [role, setRole] = useState("Manager");
  const activeUser = role === "Employee" ? 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' : 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const [toast, setToast] = useState({ show: false, msg: "", color: "#1a7f37" });
  const timerRef = useRef(null);

  function showToast(msg, color = "#1a7f37") {
    setToast({ show: true, msg, color });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  function handleRole(r) {
    setRole(r);
    showToast(\`🔄 Switched to \${r} view\`, "#008CC8");
  }

  const TABS = [["overview","◆ Overview"],["employee","○ Employee"],["manager","◈ Manager"],["hr","◆ HR Dashboard"],["themes","◈ Themes"],["architecture","⊞ Architecture"]];

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
              {["Manager", "Employee", "HR"].map(r => <button key={r} className={\`role-btn\${role === r ? " active" : ""}\`} onClick={() => handleRole(r)}>{r}</button>)}
            </div>
            <div className="nav-user">James Okafor <div className="avatar">JO</div></div>
          </div>
        </nav>
        {page === "overview" && <Overview />}
        {page === "employee" && <Employee showToast={showToast} activeUser={activeUser} />}
        {page === "manager" && <Manager showToast={showToast} activeUser={activeUser} />}
        {page === "hr" && <HR showToast={showToast} />}
        {page === "themes" && <Themes />}
        {page === "architecture" && <Architecture />}
        <Toast msg={toast.msg} color={toast.color} show={toast.show} />
      </div>
    </>
  );
}`;

const replacement = `// ── APP ──
export default function App() {
  const [page, setPage] = useState("overview");
  const [role, setRole] = useState("Manager"); // UI view default
  const [activeUser, setActiveUser] = useState(null); // Real UUID string
  const [profile, setProfile] = useState(null); // Real profile mapping
  const [toast, setToast] = useState({ show: false, msg: "", color: "#1a7f37" });
  const timerRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
         navigate("/");
         return;
      }
      
      setActiveUser(session.user.id);
      
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(profileData);
      
      // Auto-load portal page based on Login Dropdown Target Role
      const targetRole = location.state?.targetRole || profileData?.role || 'employee';
      if (targetRole === 'employee') setPage('employee');
      else if (targetRole === 'manager') setPage('manager');
      else if (targetRole === 'hr') setPage('hr');
      
      setRole(targetRole.charAt(0).toUpperCase() + targetRole.slice(1));
    }
    
    initSession();
  }, [location.state]);

  function showToast(msg, color = "#1a7f37") {
    setToast({ show: true, msg, color });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  function handleRole(r) {
    setRole(r);
    showToast(\`🔄 Switched to \${r} view\`, "#008CC8");
  }
  
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const TABS = [["overview","◆ Overview"],["employee","○ Employee"],["manager","◈ Manager"],["hr","◆ HR Dashboard"],["themes","◈ Themes"],["architecture","⊞ Architecture"]];

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
              {["Manager", "Employee", "HR"].map(r => <button key={r} className={\`role-btn\${role === r ? " active" : ""}\`} onClick={() => handleRole(r)}>{r}</button>)}
            </div>
            <div className="nav-user" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {profile ? \`\${profile.first_name} \${profile.last_name}\` : "User"} 
              <div className="avatar">{profile?.avatar_text || "U"}</div>
              <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #d0d7de', borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: '#cf222e' }}>Logout</button>
            </div>
          </div>
        </nav>
        {page === "overview" && <Overview />}
        {page === "employee" && <Employee showToast={showToast} activeUser={activeUser} />}
        {page === "manager" && <Manager showToast={showToast} activeUser={activeUser} />}
        {page === "hr" && <HR showToast={showToast} />}
        {page === "themes" && <Themes />}
        {page === "architecture" && <Architecture />}
        <Toast msg={toast.msg} color={toast.color} show={toast.show} />
      </div>
    </>
  );
}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.jsx', code);
console.log("Successfully replaced App Component in App.jsx");
