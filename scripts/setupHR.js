import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Update ALL_TABS to include HR
code = code.replace(
  'const ALL_TABS = [["overview","◆ Overview"],["employee","○ Employee"],["manager","◈ Manager"],["themes","◈ Themes"]];',
  'const ALL_TABS = [["overview","◆ Overview"],["employee","○ Employee"],["manager","◈ Manager"],["hr","◆ HR Analytics"],["themes","◈ Themes"]];'
);

// 2. Update TABS visibility logic
code = code.replace(
  "const TABS = profile?.role === 'employee' \n      ? ALL_TABS.filter(t => t[0] !== 'manager') \n      : ALL_TABS;",
  `const TABS = profile?.role === 'employee' 
      ? ALL_TABS.filter(t => !['manager', 'hr'].includes(t[0])) 
      : profile?.role === 'manager' 
      ? ALL_TABS.filter(t => t[0] !== 'hr') 
      : ALL_TABS;`
);

// 3. Update Nav Role-Switch logic
code = code.replace(
  `              {profile?.role === 'manager' && (
                <button className={\`role-btn\${role === "Manager" ? " active" : ""}\`} onClick={() => handleRole("Manager")}>Manager</button>
              )}`,
  `              {profile?.role === 'manager' && (
                <button className={\`role-btn\${role === "Manager" ? " active" : ""}\`} onClick={() => handleRole("Manager")}>Manager</button>
              )}
              {profile?.role === 'hr' && (
                <button className={\`role-btn\${role === "HR" ? " active" : ""}\`} onClick={() => handleRole("HR")}>HR Portal</button>
              )}`
);

// 4. Update HR component to take profile/activeUser and be slightly more dynamic
code = code.replace(
  'function HR({ showToast }) {',
  'function HR({ showToast, activeUser }) {\n  const [stats, setStats] = useState({ total: 0, yes: 0, no: 0, themes: 0 });\n\n  useEffect(() => {\n    fetchHRStats();\n  }, [activeUser]);\n\n  async function fetchHRStats() {\n    const { count: total } = await supabase.from(\'profiles\').select(\'id\', { count: \'exact\', head: true });\n    const { count: themes } = await supabase.from(\'themes\').select(\'id\', { count: \'exact\', head: true });\n    const { data: reviews } = await supabase.from(\'monthly_reviews\').select(\'overall_result\').eq(\'cycle_id\', CYCLE_ID);\n    \n    const yes = reviews?.filter(r => r.overall_result === \'YES\').length || 0;\n    const no = reviews?.filter(r => r.overall_result === \'NO\').length || 0;\n\n    setStats({ total: total || 0, yes, no, themes: themes || 0 });\n  }'
);

// Update StatCards in HR component to use the new stats
code = code.replace(
  '<StatCard cls="blue" label="Overall YES" val="610" note="72.1% of employees" />',
  '<StatCard cls="blue" label="Overall YES" val={stats.yes} note={`${stats.total ? Math.round((stats.yes/stats.total)*100) : 0}% of employees`} />'
);
code = code.replace(
  '<StatCard cls="orange" label="Overall NO" val="237" valCls="orange" note="27.9% — needs attention" noteColor="#cf222e" />',
  '<StatCard cls="orange" label="Overall NO" val={stats.no} valCls="orange" note={`${stats.total ? Math.round((stats.no/stats.total)*100) : 0}% of employees`} noteColor="#cf222e" />'
);
code = code.replace(
  '<StatCard cls="blue" label="Completion Rate" val="96%" valCls="green" note="↑ 811 of 847 submitted" noteColor="#1a7f37" />',
  '<StatCard cls="blue" label="Active Headcount" val={stats.total} valCls="green" note="Synced from SAP Connect" noteColor="#1a7f37" />'
);
code = code.replace(
  '<StatCard cls="purple" label="Validation Rate" val="84%" valCls="purple" note="Themes validated by managers" noteColor="#8250df" />',
  '<StatCard cls="purple" label="Total Themes" val={stats.themes} valCls="purple" note="Submitted evidence engine" noteColor="#8250df" />'
);

// Update HR render call
code = code.replace(
  '{page === "hr" && <HR showToast={showToast} />}',
  '{page === "hr" && <HR showToast={showToast} activeUser={activeUser} />}'
);

fs.writeFileSync('src/App.jsx', code);
console.log("HR Dashboard logic activated.");
