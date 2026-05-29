import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Pass profile to Employee and Manager in App() return
code = code.replace(
  '{page === "employee" && <Employee showToast={showToast} activeUser={activeUser} />}',
  '{page === "employee" && <Employee showToast={showToast} activeUser={activeUser} profile={profile} />}'
);
code = code.replace(
  '{page === "manager" && <Manager showToast={showToast} activeUser={activeUser} />}',
  '{page === "manager" && <Manager showToast={showToast} activeUser={activeUser} profile={profile} />}'
);

// 2. Update Employee component definition and logic
const employeeStart = code.indexOf('function Employee({ showToast, activeUser }) {');
if (employeeStart !== -1) {
  code = code.replace(
    'function Employee({ showToast, activeUser }) {',
    'function Employee({ showToast, activeUser, profile }) {'
  );
  
  // Add managerName state and fetching logic
  code = code.replace(
    '  const [hasSubordinates, setHasSubordinates] = useState(false);',
    '  const [hasSubordinates, setHasSubordinates] = useState(false);\n  const [managerName, setManagerName] = useState("Loading...");'
  );
  
  code = code.replace(
    '    fetchMyDirections();\n  }, [activeUser]);',
    '    fetchMyDirections();\n    fetchManagerName();\n  }, [activeUser]);'
  );
  
  // Add fetchManagerName function
  code = code.replace(
    '  async function fetchMyDirections() {',
    '  async function fetchManagerName() {\n    if (!profile?.manager_id) return;\n    const { data } = await supabase.from(\'profiles\').select(\'first_name, last_name\').eq(\'id\', profile.manager_id).single();\n    if (data) setManagerName(`${data.first_name} ${data.last_name}`);\n  }\n\n  async function fetchMyDirections() {'
  );

  // Replace hardcoded Sarah Mitchell strings
  code = code.replace(
    '<div className="page-sub">April 2025 · Sarah Mitchell · Frontend Developer</div>',
    '<div className="page-sub">April 2025 · {profile?.first_name} {profile?.last_name} · {profile?.job_title}</div>'
  );
  
  code = code.replace(
    '<div className="emp-av">SM</div>',
    '<div className="emp-av">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</div>'
  );
  
  code = code.replace(
    '<div className="emp-name">Sarah Mitchell</div>',
    '<div className="emp-name">{profile?.first_name} {profile?.last_name}</div>'
  );
  
  code = code.replace(
    '<div className="emp-meta">EMP-12345 · Frontend Developer · Manager: James Okafor</div>',
    '<div className="emp-meta">{profile?.employee_id} · {profile?.job_title} · Manager: {managerName}</div>'
  );
}

// 3. Update Manager component definition and logic
const managerStart = code.indexOf('function Manager({ showToast, activeUser }) {');
if (managerStart !== -1) {
  code = code.replace(
    'function Manager({ showToast, activeUser }) {',
    'function Manager({ showToast, activeUser, profile }) {'
  );
  
  code = code.replace(
    '<div className="page-sub">April 2025 · James Okafor · Engineering Lead</div>',
    '<div className="page-sub">April 2025 · {profile?.first_name} {profile?.last_name} · {profile?.job_title}</div>'
  );
}

fs.writeFileSync('src/App.jsx', code);
console.log("App.jsx updated with dynamic profile data.");
