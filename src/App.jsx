import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/config/supabaseClient';
import * as XLSX from 'xlsx';
import './index.css';
import VoiceAssistant from './components/VoiceAssistant';

function isSubthemeInMonth(sub, month, year) {
  const desc = sub.global_subthemes?.description || sub.description;
  
  if (desc && desc.includes('[') && desc.includes(']')) {
    try {
      const datePart = desc.split('[')[1].split(']')[0].split('|')[0].trim();
      const firstDateStr = datePart.split(/\s+-\s+/)[0].trim();
      let dateToTest = firstDateStr;
      if (firstDateStr && firstDateStr !== 'undefined') {
        if (firstDateStr.includes('/')) {
          const [d, m, y] = firstDateStr.split('/');
          dateToTest = `${y}-${m}-${d}`;
        }
        const d = new Date(dateToTest);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('en-US', { month: 'short' }).toUpperCase() === month && d.getFullYear() === parseInt(year);
        }
      }
    } catch (e) {
      console.error("Error parsing date in isSubthemeInMonth:", e);
    }
  }

  // Fallback 1: Check sub.submitted_at or sub.created_at
  const dateStr = sub.submitted_at || sub.created_at || sub.global_subthemes?.created_at;
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-US', { month: 'short' }).toUpperCase() === month && d.getFullYear() === parseInt(year);
    }
  }

  // Fallback 2: Default to true to keep it visible
  return true;
}

// ── CONFIG & CONSTANTS ──
// CYCLE_ID moved to dynamic evaluation based on selectedMonth and currentYear
const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4'];

function getInitials(p) {
  if (!p) return "??";
  const f = p.first_name?.[0] || "";
  const l = p.last_name?.[0] || "";
  return (f + l).toUpperCase() || "??";
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

// ── VALIDATION HELPERS ──
const CURRENT_YEAR = new Date().getFullYear();

export let ALL_CYCLES = [];
export let ACTIVE_CYCLE = null;

export function getCycleIdForYear(yearStr) {
  if (!yearStr) return ACTIVE_CYCLE?.id;
  const cycle = ALL_CYCLES.find(c => c.cycle_name && c.cycle_name.includes(String(yearStr)));
  return cycle ? cycle.id : ACTIVE_CYCLE?.id;
}

function isCurrentMonth(dateStr) {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr);
    const now = new Date();
    // Use UTC or local depending on requirement; usually local for portal users
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  } catch (e) { return false; }
}

function canEdit() {
  return true; // Allowed anytime during the month
}

function isThemeAligned(theme, pillar) {
  if (!theme || !pillar) return false;

  const parentId = String(theme.parent_id || "").toLowerCase().trim();
  const mainId = String(theme.main_theme_id || "").toLowerCase().trim();
  const pillarId = String(pillar.id || "").toLowerCase().trim();

  // 1. Strict ID Match (Primary)
  if ((parentId && pillarId && parentId === pillarId) || (mainId && pillarId && mainId === pillarId)) {
    return true;
  }

  // 2. Title Match (Fallback for de-duplicated pillars)
  const themeTitle = (theme.title || "").toLowerCase().trim();
  const pillarTitle = (pillar.title || pillar.name || "").toLowerCase().trim();

  // Check if theme was explicitly intended for this pillar's title
  // We only do this if the theme is an alignment record (has a parent or main ID)
  if (parentId || mainId) {
    return themeTitle.includes(pillarTitle) || (pillarTitle && themeTitle.includes("verification:") && themeTitle.toLowerCase().includes(pillarTitle.toLowerCase()));
  }

  return false;
}

// ── SHARED COMPONENTS ──
function Toast({ msg, color, show }) {
  return (
    <div className={`toast ${show ? "toast-show" : "toast-hidden"}`} style={{ background: color }}>
      <span className="toast-icon">✓</span><span>{msg}</span>
    </div>
  );
}

function Badge({ cls, dot, children }) {
  return (
    <span className={`badge badge-${cls}`}>
      {dot && <span className="badge-dot" />}{children}
    </span>
  );
}

function StatCard({ cls, label, val, valCls, note }) {
  return (
    <div className={`stat-card stat-card-${cls}`}>
      <div className="stat-label">{label}</div>
      <div className={`stat-val ${valCls || ""}`}>{val}</div>
      {note && <div className="stat-note">◈ {note}</div>}
    </div>
  );
}


// ── OVERVIEW PORTAL ──
function Overview({ profile }) {
  const [allProfilesCount, setAllProfilesCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [yesOutcomeCount, setYesOutcomeCount] = useState(0);
  const [cycleThemes, setCycleThemes] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const completionRate = allProfilesCount > 0 ? Math.round((submissionCount / allProfilesCount) * 100) : 0;
  const overallYesRate = submissionCount > 0 ? Math.round((yesOutcomeCount / submissionCount) * 100) : 0;
  const pendingGeneral = cycleThemes.filter(t => t.status === 'pending_review' || t.status === 'pending_hr_approval').length;

  const alertCount = 3; // Static count for now based on the 3 alerts below

  useEffect(() => {
    async function fetchOverviewData() {
      // 1. Total employees
      const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      setAllProfilesCount(empCount || 0);

      // 2. Reviews for cycle
      const { data: cycleReviews } = await supabase.from('monthly_reviews').select('overall_result');
      setSubmissionCount(cycleReviews?.length || 0);
      setYesOutcomeCount(cycleReviews?.filter(r => r.overall_result === 'YES').length || 0);

      // 3. Themes for cycle
      const { data: themes } = await supabase.from('global_themes').select('*').eq('status', 'approved');
      setCycleThemes(themes || []);
    }
    fetchOverviewData();
  }, []);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="portal-label">◆ EXECUTIVE OVERVIEW · APRIL 2026</div>
        <div style={{ position: 'relative' }}>
          <button
            className="badge badge-red"
            style={{ cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', padding: '6px 12px' }}
            onClick={() => setShowAlerts(!showAlerts)}
          >
            🔔 <span style={{ fontWeight: 800 }}>{alertCount}</span> Alerts
          </button>

          {showAlerts && (
            <div className="frame" style={{
              position: 'absolute', right: 0, top: 40, width: 400, zIndex: 100,
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: '1px solid var(--border)'
            }}>
              <div className="sec-title" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>Exceptions & Alerts</div>
              <div className="v-stack" style={{ gap: 8 }}>
                <div className="alert-item alert-warn" style={{ fontSize: 11 }}>
                  <div style={{ color: 'var(--red)', flexShrink: 0 }}>⚠</div>
                  <div><strong style={{ color: 'var(--red)' }}>3 employees</strong> have received No results for 3+ consecutive months</div>
                </div>
                <div className="alert-item alert-info" style={{ fontSize: 11 }}>
                  <div style={{ color: 'var(--yellow)', flexShrink: 0 }}>○</div>
                  <div><strong style={{ color: 'var(--yellow)' }}>14 themes</strong> pending validation — cycle closes in 4 days</div>
                </div>
                <div className="alert-item alert-ok" style={{ fontSize: 11 }}>
                  <div style={{ color: 'var(--green)', flexShrink: 0 }}>✓</div>
                  <div>Nightly SAP Connect sync completed successfully</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="page-title">Continuous Performance<br /><span>Framework Dashboard</span></div>
      <div className="page-sub">Monthly binary review cycles · Theme validation · Rolling period roll-up · SAP Connect integration</div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard cls="blue" label="Active Employees" val={allProfilesCount.toString()} note="Synced from database" />
        <StatCard cls="blue" label="Submission Completion" val={`${completionRate}%`} note={`${submissionCount} reviews submitted`} />
        <StatCard cls="yellow" label="Overall YES Rate" val={`${overallYesRate}%`} valCls="yellow" note={`${yesOutcomeCount} positive outcomes`} />
        <StatCard cls="purple" label="Pending Validations" val={pendingGeneral} valCls="purple" note="Actions awaiting approval" />
      </div>

      <div className="sec-title">How It Works</div>
      <div className="flow-container">
        <div className="flow-rows">
          <div className="flow-row">
            <div className="flow-step"><div className="flow-step-label">SAP CONNECT</div><div className="flow-step-name">Employee Data</div></div>
            <div className="flow-arrow">→</div>
            <div className="flow-step"><div className="flow-step-label">STEP 1</div><div className="flow-step-name">Manager Direction</div></div>
            <div className="flow-arrow">→</div>
            <div className="flow-step hl"><div className="flow-step-label">STEP 2</div><div className="flow-step-name">Employee Themes</div></div>
            <div className="flow-arrow">→</div>
            <div className="flow-step hl"><div className="flow-step-label">STEP 3</div><div className="flow-step-name">4 Binary Inputs</div></div>
            <div className="flow-arrow">→</div>
          </div>
          <div className="flow-row" style={{ marginTop: 12 }}>
            <div className="flow-step green-step"><div className="flow-step-label">AUTO CALC</div><div className="flow-step-name">Yes / No Result</div></div>
            <div className="flow-arrow">→</div>
            <div className="flow-step"><div className="flow-step-label">STEP 4</div><div className="flow-step-name">Theme Validation</div></div>
            <div className="flow-arrow">→</div>
            <div className="flow-step purple-step"><div className="flow-step-label">ROLL-UP</div><div className="flow-step-name">Q / Annual View</div></div>
          </div>
        </div>
      </div>


      <div className="frame">
        <div className="sec-title">Function Rating Analysis (Yes Rate)</div>
        <div className="bar-row"><span className="bar-label">Engineering</span><div className="bar-track"><div className="bar-fill" style={{ width: '76%', background: 'var(--cyan)' }}></div></div><span className="bar-pct">76%</span></div>
        <div className="bar-row"><span className="bar-label">Product</span><div className="bar-track"><div className="bar-fill" style={{ width: '71%', background: 'var(--purple)' }}></div></div><span className="bar-pct">71%</span></div>
        <div className="bar-row"><span className="bar-label">Marketing</span><div className="bar-track"><div className="bar-fill" style={{ width: '68%', background: 'var(--blue)' }}></div></div><span className="bar-pct">68%</span></div>
        <div className="bar-row"><span className="bar-label">Operations</span><div className="bar-track"><div className="bar-fill" style={{ width: '74%', background: 'var(--yellow)' }}></div></div><span className="bar-pct">74%</span></div>
        <div className="bar-row"><span className="bar-label">Sales</span><div className="bar-track"><div className="bar-fill" style={{ width: '63%', background: 'var(--red)' }}></div></div><span className="bar-pct">63%</span></div>
        <div className="bar-row"><span className="bar-label">HR</span><div className="bar-track"><div className="bar-fill" style={{ width: '80%', background: 'var(--green)' }}></div></div><span className="bar-pct">80%</span></div>
      </div>

      <div className="frame" style={{ marginBottom: 20 }}>
        <div className="sec-title">Monthly Trend — Yes Rate</div>
        <svg width="100%" viewBox="0 0 800 80" style={{ display: 'block' }}>
          <polyline points="0,65 160,58 320,48 480,42 640,36 800,30" style={{ stroke: 'var(--cyan)', strokeWidth: 2, fill: 'none' }} />
          <circle cx="0" cy="65" r="4" fill="var(--cyan)" /><circle cx="160" cy="58" r="4" fill="var(--cyan)" /><circle cx="320" cy="48" r="4" fill="var(--cyan)" /><circle cx="480" cy="42" r="4" fill="var(--cyan)" /><circle cx="640" cy="36" r="4" fill="var(--cyan)" /><circle cx="800" cy="30" r="4" fill="var(--cyan)" />
          <text x="0" y="78" fontSize="10" fill="#8c959f">Nov</text><text x="148" y="78" fontSize="10" fill="#8c959f">Dec</text><text x="308" y="78" fontSize="10" fill="#8c959f">Jan</text><text x="462" y="78" fontSize="10" fill="#8c959f">Feb</text><text x="622" y="78" fontSize="10" fill="#8c959f">Mar</text><text x="778" y="78" fontSize="10" fill="#8c959f">Apr</text>
        </svg>
      </div>

      {/* Fixed alerts section removed - now in notification badge */}
    </div>
  );
}

function EvidenceBox({ themeId, evidence, updateEvidence, readonly, onReflectionSubmit }) {
  const WORD_LIMIT = 125;
  

  const countWords = (text) => text?.trim() ? text.trim().split(/\s+/).length : 0;

  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;
  const maxDate = `${currentYear}-12-31`;

  const handleDateUpdate = (field, value) => {
    updateEvidence(themeId, field, value);
  };

  const fields = [
    { key: 'achievements', label: 'KEY ACHIEVEMENTS THIS MONTH', placeholder: 'Describe your main contributions, project outcomes, and delivery highlights...' },
    { key: 'blockers', label: 'CHALLENGES / BLOCKERS', placeholder: 'Any blockers or challenges faced this month...' },
    { key: 'learning', label: 'LEARNING & DEVELOPMENT POINTS', placeholder: 'Skills developed, courses completed, initiatives taken...' }
  ];

  return (
    <div className="evidence-box">
      {!readonly && (
        <div className="h-stack" style={{ gap: 12, marginBottom: 20, padding: '12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <div className="v-stack" style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>ACTIVITY START</div>
            <input
              type="date"
              className="input"
              min={minDate}
              max={maxDate}
              value={evidence?.start_date || ""}
              onChange={(e) => {
                let val = e.target.value;
                const yearMatch = val.match(/\d{4}/);
                if (yearMatch && parseInt(yearMatch[0]) !== currentYear) {
                  val = val.replace(yearMatch[0], String(currentYear));
                  showToast(`Year adjusted to ${currentYear}`, "var(--orange)");
                }
                handleDateUpdate('start_date', val);
              }}
            />
          </div>
          <div className="v-stack" style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>ACTIVITY END</div>
            <input
              type="date"
              className="input"
              min={minDate}
              max={maxDate}
              value={evidence?.end_date || ""}
              onChange={(e) => {
                let val = e.target.value;
                const yearMatch = val.match(/\d{4}/);
                if (yearMatch && parseInt(yearMatch[0]) !== currentYear) {
                  val = val.replace(yearMatch[0], String(currentYear));
                  showToast(`Year adjusted to ${currentYear}`, "var(--orange)");
                }
                handleDateUpdate('end_date', val);
              }}
            />
          </div>
        </div>
      )}

      {fields.map(f => (
        <div key={f.key} className="evidence-group" style={f.key === 'learning' ? { marginBottom: 0 } : {}}>
          <div className="evidence-label">
            {f.label}
            {!readonly && (
              <span className={`evidence-counter ${countWords(evidence?.[f.key] || "") >= WORD_LIMIT ? 'limit-hit' : ''}`}>
                {countWords(evidence?.[f.key] || "")} / {WORD_LIMIT} words
              </span>
            )}
          </div>
          <textarea
            className={`evidence-input ${readonly ? 'readonly' : ''}`}
            placeholder={f.placeholder}
            value={evidence?.[f.key] || ""}
            onChange={(e) => {
              if (readonly) return;
              let val = e.target.value;
              if (countWords(val) > WORD_LIMIT) {
                val = val.trim().split(/\s+/).slice(0, WORD_LIMIT).join(' ');
              }
              updateEvidence(themeId, f.key, val);
            }}
            readOnly={readonly}
            rows={4}
          />
        </div>
      ))}
      {!readonly && (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-primary"
            style={{ background: 'var(--cyan)', padding: '10px 24px', fontSize: 13, border: 'none' }}
            onClick={() => onReflectionSubmit(themeId)}
          >
            Submit Monthly Subtheme →
          </button>
        </div>
      )}
    </div>
  );
}

// ── EMPLOYEE PORTAL ──
function Employee({ profile, activeUser, showToast }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [themes, setThemes] = useState([]);
  const [globalSubthemes, setGlobalSubthemes] = useState([]);
  const [selectedSubthemes, setSelectedSubthemes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshCount, setRefreshCount] = useState(0);
  const [rootThemes, setRootThemes] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", linked_objective: "", achievement_evidence: "", start_date: "", end_date: "" });
  const [themeEvidence, setThemeEvidence] = useState({}); // { theme_id: { achievements, blockers, learning, start_date, end_date } }
  const [monthlyEvidence, setMonthlyEvidence] = useState({ achievements: "", blockers: "", learning: "", proofPoints: "", attachments: [], subtheme_id: "", rating_status: "PENDING", manager_comment: "" });
  const [activeSubthemeId, setActiveSubthemeId] = useState(null);
  const [editSubthemeId, setEditSubthemeId] = useState(null);
  const [editThemeId, setEditThemeId] = useState(null);
  const [isPillarPickerOpen, setIsPillarPickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase());
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [managerProfile, setManagerProfile] = useState(null);
  const [editSubmittedEvidence, setEditSubmittedEvidence] = useState(false);
  const [hasJustSubmitted, setHasJustSubmitted] = useState(false);

  useEffect(() => {
    setHasJustSubmitted(false);
  }, [selectedMonth, selectedYear]);

  const [isBridgeCollapsed, setIsBridgeCollapsed] = useState(false);

  // Authority Console States
  const [team, setTeam] = useState([]);
  const [myAssignedThemes, setMyAssignedThemes] = useState([]);
  const [teamThemes, setTeamThemes] = useState([]);
  const [showCreator, setShowCreator] = useState(false);
  
  // Strict Date Boundaries (Current Month -> Today)
  const todayLocal = new Date();
  const currentYear = todayLocal.getFullYear();
  const currentMonthStr = String(todayLocal.getMonth() + 1).padStart(2, '0');
  const todayDayStr = String(todayLocal.getDate()).padStart(2, '0');
  
  const minDate = `${currentYear}-${currentMonthStr}-01`;
  const maxDate = `${currentYear}-${currentMonthStr}-${todayDayStr}`;
  const today = maxDate;

  

  
  const [newDirective, setNewDirective] = useState({ title: "", description: "", start_date: today, end_date: today });

  const [returningId, setReturningId] = useState(null);
  const [superiorInput, setSuperiorInput] = useState("");
  const [returningSubthemeId, setReturningSubthemeId] = useState(null);
  const [subthemeFeedback, setSubthemeFeedback] = useState("");

  const totalTeamAlignments = teamThemes.filter(t => {
    // ONLY count alignments for team members, NOT for the active user themselves
    const isTeamMember = (t.employee_id !== activeUser) && (t.assigned_to !== activeUser);
    if (!isTeamMember) return false;

    const desc = t.global_subthemes?.description || t.description;
    if (!desc || !desc.includes('[') || !desc.includes(']')) return false;
    try {
      const datePart = desc.split('[')[1].split(']')[0].split('|')[0].trim();
      const firstDateStr = datePart.split(/\s+-\s+/)[0].trim();
      let dateToTest = firstDateStr;
      if (firstDateStr.includes('/')) {
        const [d, m, y] = firstDateStr.split('/');
        dateToTest = `${y}-${m}-${d}`;
      }
      const d = new Date(dateToTest);
      return d.toLocaleString('en-US', { month: 'short' }).toUpperCase() === selectedMonth && d.getFullYear() === parseInt(selectedYear);
    } catch (e) { return false; }
  }).length;
  const [myReviews, setMyReviews] = useState([]);

  const countWords = (text) => text?.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    refreshEmployeeDash();
    fetchReviewsHistory();
  }, [activeUser, refreshCount, selectedMonth, selectedYear, profile?.department]);

  async function fetchReviewsHistory() {
    const { data } = await supabase
      .from('monthly_reviews')
      .select('*')
      .eq('employee_id', activeUser);
    setMyReviews(data || []);
  }

  // Load existing monthly review into form if it exists
  useEffect(() => {
    setEditSubmittedEvidence(false);
    if (!myReviews || myReviews.length === 0) {
      setMonthlyEvidence({
        achievements: "",
        blockers: "",
        learning: "",
        proofPoints: "",
        attachments: [],
        subtheme_id: "",
        rating_status: "PENDING",
        manager_comment: ""
      });
      return;
    }

    const currentCycleId = getCycleIdForYear(selectedYear);
    const existing = myReviews.find(r => 
      r.employee_id === activeUser && 
      (String(r.review_month || '').toUpperCase() === selectedMonth.toUpperCase() || r.cycle_id === `${selectedMonth}_${selectedYear}`) &&
      (r.cycle_id === currentCycleId || r.cycle_id === `${selectedMonth}_${selectedYear}`)
    );

    if (existing && !hasJustSubmitted) {
      let parsedAttachments = [];
      try {
        parsedAttachments = typeof existing.attachments === 'string' ? JSON.parse(existing.attachments) : (existing.attachments || []);
      } catch (e) {
        console.error("Error parsing attachments:", e);
      }

      setMonthlyEvidence({
        achievements: existing.emp_achievements || "",
        blockers: existing.emp_blockers || "",
        learning: existing.emp_learning || "",
        proofPoints: existing.emp_proof_points || "",
        attachments: parsedAttachments,
        subtheme_id: existing.subtheme_id || "",
        rating_status: existing.rating_status || "PENDING",
        manager_comment: existing.manager_comment || "",
        submitted_at: existing.submitted_at || null
      });
    } else {
      setMonthlyEvidence({
        achievements: "",
        blockers: "",
        learning: "",
        proofPoints: "",
        attachments: [],
        subtheme_id: "",
        rating_status: "PENDING",
        manager_comment: "",
        submitted_at: null
      });
    }
  }, [myReviews, selectedMonth, selectedYear, activeUser]);




  const fileInputRef = useRef(null);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${activeUser}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    showToast("Uploading file...", "var(--purple)");

    const { error: uploadError } = await supabase.storage
      .from('evidence')
      .upload(filePath, file);

    if (uploadError) {
      showToast("Upload failed. Ensure 'evidence' bucket exists.", "var(--red)");
      console.error(uploadError);
      return;
    }

    const { data } = supabase.storage.from('evidence').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    setMonthlyEvidence(prev => ({
      ...prev,
      attachments: [...prev.attachments, { name: file.name, url: publicUrl, path: filePath }]
    }));

    showToast("File uploaded successfully!", "var(--green)");
  }

  async function handleRemoveAttachment(idx) {
    const file = monthlyEvidence.attachments[idx];
    if (file.path) {
      await supabase.storage.from('evidence').remove([file.path]);
    }
    setMonthlyEvidence(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  }

  async function handleEvidenceSubmit() {
    // We need to find the manager_id for this employee to upsert correctly
    const { data: profileData } = await supabase.from('profiles').select('manager_id').eq('id', activeUser).single();
    
    let targetManagerId = profileData?.manager_id;
    if (!targetManagerId) {
      const { data: hods } = await supabase.from('profiles').select('id').eq('role', 'hod').limit(1);
      targetManagerId = hods?.[0]?.id;
    }

    const evidenceData = {
      employee_id: activeUser,
      cycle_id: getCycleIdForYear(selectedYear),
      review_month: selectedMonth.toUpperCase(),
      manager_id: targetManagerId,
      emp_achievements: monthlyEvidence.achievements,
      emp_blockers: monthlyEvidence.blockers,
      emp_learning: monthlyEvidence.learning,
      emp_proof_points: monthlyEvidence.proofPoints,
      attachments: JSON.stringify(monthlyEvidence.attachments),
      subtheme_id: monthlyEvidence.subtheme_id || null,
      rating_status: 'PENDING',
      submitted_at: new Date().toISOString()
    };

    console.log("📤 SUBMITTING EVIDENCE DATA:", evidenceData);

    const { error } = await supabase.from('monthly_reviews').upsert([evidenceData], { onConflict: 'employee_id,review_month,cycle_id' });

    if (!error) {
      showToast('✓ Monthly evidence submitted and saved', 'var(--green)');
      setEditSubmittedEvidence(false);
      setHasJustSubmitted(true);
      // Clear the inputs as requested by the user so they can submit fresh data next time
      setMonthlyEvidence({
        achievements: "",
        blockers: "",
        learning: "",
        proofPoints: "",
        attachments: [],
        rating_status: 'PENDING',
        manager_comment: ""
      });
      fetchReviewsHistory();
    } else {
      console.error("Error saving evidence:", error);
      showToast('Error saving evidence. Ensure DB columns exist.', 'var(--red)');
    }
  }

  // --- FAIL-SAFE DATE GUARDIAN ---
  // This ensures that no matter how the date is entered (manual, picker, etc.), 
  // it is ALWAYS forced to the current year immediately.
  useEffect(() => {
    const enforce = (d) => {
      if (!d || typeof d !== 'string') return d;
      const parts = d.split('-');
      if (parts[0] && parts[0].length === 4 && parts[0] !== String(currentYear)) {
        return [String(currentYear), parts[1] || '01', parts[2] || '01'].join('-');
      }
      return d;
    };
    const nextStart = enforce(newDirective.start_date);
    const nextEnd = enforce(newDirective.end_date);
    if (nextStart !== newDirective.start_date || nextEnd !== newDirective.end_date) {
      setNewDirective(prev => ({ ...prev, start_date: nextStart, end_date: nextEnd }));
      showToast(`Year restricted to ${currentYear}`, "var(--orange)");
    }
  }, [newDirective.start_date, newDirective.end_date, currentYear]);

  async function refreshEmployeeDash() {
    if (!activeUser) return;
    
    // Fetch Global Themes & Subthemes (Defined by HOD/MD)
    let { data: gThemes } = await supabase.from('global_themes').select('*, global_subthemes(*)').eq('status', 'approved').eq('cycle_id', getCycleIdForYear(selectedYear));
    if (gThemes && profile?.department) {
      gThemes = gThemes.filter(t => !t.department || t.department.trim().toLowerCase() === profile.department.trim().toLowerCase());
    }
    
    // Manual join in frontend since we're using direct Supabase client
    if (gThemes && gThemes.length > 0) {
      const creatorIds = [...new Set(gThemes.map(t => t.created_by).filter(Boolean))];
      const { data: pData } = await supabase.from('profiles').select('id, role').in('id', creatorIds);
      const enriched = gThemes.map(t => {
        const p = pData?.find(profile => profile.id === t.created_by);
        return { ...t, creator_role: p?.role || 'hod' }; // Default to HOD for legacy/MD themes
      });
      setRootThemes(enriched);
      setGlobalSubthemes(enriched.flatMap(t => t.global_subthemes || []));
    } else {
      setRootThemes([]);
      setGlobalSubthemes([]);
    }

    // Fetch existing alignments for this employee
    const { data: alignments } = await supabase.from('employee_subtheme_alignment').select('*, global_subthemes(*)').eq('employee_id', activeUser);
    setSelectedSubthemes(alignments?.map(a => a.subtheme_id) || []);
    setThemes(alignments || []); // Using alignments as the base for themes in UI

    // NEW: Populate Team & TeamThemes for the Bridge View (Managers/Directors/MD)
    if (profile?.role === 'manager' || profile?.role === 'hod' || profile?.role === 'hr' || profile?.role === 'md') {
      let reports = [];
      if (profile?.role === 'hr') {
        const { data } = await supabase.from('profiles').select('*');
        reports = data || [];
      } else {
        const { data: hierarchy } = await supabase.rpc('get_reports_hierarchy', { manager_uuid: activeUser });
        if (hierarchy && hierarchy.length) {
          const ids = hierarchy.map(h => h.profile_id);
          const { data } = await supabase.from('profiles').select('*').in('id', ids);
          reports = data || [];
        } else {
          const { data: direct } = await supabase.from('profiles').select('*').eq('manager_id', activeUser);
          reports = direct || [];
        }
      }
      
      setTeam(reports || []);
      
      if (reports && reports.length > 0) {
        const reportIds = reports.map(r => r.id);
        const { data: rThemes } = await supabase.from('employee_subtheme_alignment').select('*, global_subthemes(*)').in('employee_id', reportIds);
        setTeamThemes(rThemes || []);
      }
    }
  }

  async function handleAlignmentSubmit() {
    // Submit alignment selections
    const records = selectedSubthemes.map(sid => ({
      employee_id: activeUser,
      subtheme_id: sid,
      cycle_year: CURRENT_YEAR,
      status: 'PENDING'
    }));
    
    const { error } = await supabase.from('employee_subtheme_alignment').upsert(records, { onConflict: 'employee_id,subtheme_id,cycle_year' });
    if (!error) showToast("Alignments submitted for approval", "var(--green)");
    else showToast("Error submitting alignment", "var(--red)");
  }

  async function handleProposeStrategicTheme() {
    if (!newDirective.title) return;

    const isHOD = profile?.role === 'hod' || profile?.role === 'md';
    const isHR = profile?.role === 'hr';

    const themeRecord = {
      title: newDirective.title.trim(),
      description: `[${newDirective.category || "General"}] ${newDirective.description.trim()}`,
      created_by: activeUser,
      status: isHOD ? 'approved' : 'pending_hod_validation',
      cycle_id: getCycleIdForYear(currentYear),
      department: profile?.department || null,
      is_active: isHOD ? 'true' : 'false'
    };

    const { error } = await supabase.from('global_themes').insert([themeRecord]);

    if (!error) {
      showToast(isHOD ? "Strategic Pillar published successfully" : "Proposal sent for HOD approval", "var(--purple)");
      setShowCreator(false);
      setNewDirective({ title: "", description: "", category: "Strategic Contribution", start_date: today, end_date: today });
      refreshEmployeeDash();
    } else {
      showToast(`Error: ${error.message}`, "#cf222e");
    }
  }


  async function handleSubmit(e) {
    if (!form.title?.trim() || !form.description?.trim()) return showToast("Title and Description are required", "var(--red)");
    if (!form.start_date || !form.end_date) return showToast("Start and End dates are required", "var(--red)");

    // --- FAIL-SAFE YEAR VALIDATION ---
    const currentYear = new Date().getFullYear();
    const isBad = (d) => {
      if (!d) return false;
      const parts = String(d).split('-');
      return parts[0] !== String(currentYear);
    };

    if (isBad(form.start_date) || isBad(form.end_date)) {
      showToast(`Restriction: Dates must be for the year ${currentYear}`, "#ef4444");
      return;
    }

    const { error } = await supabase.from('global_themes').insert([{
      ...form,
      created_by: activeUser,
      cycle_id: getCycleIdForYear(currentYear),
      status: 'submitted_to_manager'
    }]);
    if (error) {
      showToast("Error submitting theme", "#cf222e");
    } else {
      showToast("Theme submitted successfully", "var(--green)");
      setIsFormOpen(false);
      setForm({ title: "", category: "Business Impact", description: "", linked_objective: "", achievement_evidence: "", start_date: "", end_date: "" });
      refreshEmployeeDash();
    }
  }

  async function handleSubthemeAction(themeId, action, feedback = "") {
    const statusMap = { 'approve': 'APPROVED', 'return': 'REVERTED', 'reject': 'REJECTED' };
    const payload = { status: statusMap[action] };
    if (feedback) payload.manager_feedback = feedback;
    
    const { error } = await supabase.from('employee_subtheme_alignment').update(payload).eq('id', themeId);

    if (!error) {
      const msgMap = { 'approve': "Subtheme approved", 'return': "Subtheme reverted to employee", 'reject': "Subtheme rejected" };
      const colorMap = { 'approve': "var(--green)", 'return': "var(--yellow)", 'reject': "var(--red)" };
      showToast(msgMap[action], colorMap[action]);
      refreshEmployeeDash();
    } else {
      showToast("Error updating subtheme", "var(--red)");
    }
  }

  const updateEvidence = (tid, field, val) => {
    setThemeEvidence(prev => ({
      ...prev,
      [tid]: { ...(prev[tid] || {}), [field]: val }
    }));
  };

  // --- THEME SUBMISSION (For Employees & Directors) ---
  async function handleSubthemeSubmit(parentThemeId, formData, targetEmployeeId = null, existingId = null) {
    if (!formData.title?.trim() || !formData.description?.trim()) {
      showToast("Please enter both a Title and Description.", "var(--red)");
      return;
    }

    // Strict Validation: Must be in the current month AND cannot exceed today's date
    const todayLocal = new Date();
    const currentYear = todayLocal.getFullYear();
    const currentMonthStr = String(todayLocal.getMonth() + 1).padStart(2, '0');
    const todayDayStr = String(todayLocal.getDate()).padStart(2, '0');
    
    const minDate = `${currentYear}-${currentMonthStr}-01`;
    const maxDate = `${currentYear}-${currentMonthStr}-${todayDayStr}`;
    const todayStr = maxDate;

    if (formData.start_date < minDate || formData.end_date < minDate) {
      showToast(`Restriction: Sub-themes can only be submitted for the current month (${todayLocal.toLocaleString('default', { month: 'long' })}).`, "#ef4444");
      return;
    }

    if (formData.start_date > maxDate || formData.end_date > maxDate) {
      showToast("Restriction: Cannot submit sub-themes for future dates.", "#ef4444");
      return;
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date).getTime();
      const end = new Date(formData.end_date).getTime();

      if (start > end) {
        showToast("⚠️ INVALID RANGE: From Date cannot be after To Date", "var(--red)");
        return; // This COMPLETELY stops the submission
      }
    }

    // Helper to ensure we send valid UUIDs or NULL to Supabase
    const toUUID = (val) => {
      const s = String(val || "").trim();
      return (s.length > 30) ? s : null;
    };

    const pId = toUUID(parentThemeId);
    const targetId = toUUID(targetEmployeeId) || activeUser;

    // --- RESTRICTION 1: Sub-theme Limit (REMOVED) ---
    // User can now submit multiple sub-themes for the same pillar.

    // --- RESTRICTION 2: Shared Theme Limit (Max 4 total) ---
    // Applies collectively to HOD, HR, and Managers creating new root themes
    if (['hod', 'hr', 'manager'].includes(profile?.role) && !pId && !existingId) {
      // Count ALL root themes currently active/approved in the system
      const totalRootThemesCount = rootThemes.length;

      if (totalRootThemesCount >= 4) {
        showToast(`Restriction: Maximum 4 Strategic Themes reached for this cycle.`, "#ef4444");
        return;
      }
    }

    // Construct record for global_subthemes table
    // Workaround: Prepend dates to description since start_date/end_date columns are missing
    // Construct record for global_subthemes table
    // Use ISO format internally for brackets to ensure robust parsing
    const isoStart = formData.start_date || todayStr;
    const isoEnd = formData.end_date || todayStr;
    const dateRange = ` ${isoStart} - ${isoEnd} `;
    const subDate = ` ${todayStr} `;
    
    const subthemeRecord = {
      theme_id: pId, 
      title: (formData.title || "Untitled").trim(),
      description: `[${dateRange}|${subDate}] ${(formData.description || "").trim()}`
    };

    console.log("📤 Submitting sub-theme to global_subthemes:", subthemeRecord);

    try {
      if (existingId) {
        // --- EDIT MODE: Update existing sub-theme ---
        const { data: alignData } = await supabase.from('employee_subtheme_alignment').select('subtheme_id').eq('id', existingId).single();
        if (alignData?.subtheme_id) {
          await supabase.from('global_subthemes').update({
            title: subthemeRecord.title,
            description: subthemeRecord.description
          }).eq('id', alignData.subtheme_id);
          
          let nextStatus = 'PENDING';
          const userRole = profile?.role;
          
          if (userRole === 'manager') nextStatus = 'PENDING_HR_VALIDATION';
          else if (userRole === 'hr') nextStatus = 'PENDING_HOD_VALIDATION';
          else if (userRole === 'hod') nextStatus = 'PENDING_MD_VALIDATION';
          
          // Force MD validation for cross-departmental HOD/HR submissions
          if (userRole === 'hod' || userRole === 'hr') {
            const parentTheme = rootThemes.find(rt => rt.id === pId);
            if (parentTheme && parentTheme.department !== profile.department && parentTheme.department !== null) {
              nextStatus = 'PENDING_MD_VALIDATION';
            }
          }

          await supabase.from('employee_subtheme_alignment').update({ status: nextStatus }).eq('id', existingId);
        }
      } else {
        // --- NEW MODE: Insert new sub-theme ---
        const { data: stData, error: stError } = await supabase
          .from('global_subthemes')
          .insert([subthemeRecord])
          .select()
          .single();
        
        if (stError) throw stError;

        if (stData) {
          let nextStatus = 'PENDING';
          const userRole = profile?.role;
          
          if (userRole === 'manager') nextStatus = 'PENDING_HR_VALIDATION';
          else if (userRole === 'hr') nextStatus = 'PENDING_HOD_VALIDATION';
          else if (userRole === 'hod') nextStatus = 'PENDING_MD_VALIDATION';

          // Force MD validation for cross-departmental HOD/HR submissions
          if (userRole === 'hod' || userRole === 'hr') {
            const parentTheme = rootThemes.find(rt => rt.id === pId);
            if (parentTheme && parentTheme.department !== profile.department && parentTheme.department !== null) {
              nextStatus = 'PENDING_MD_VALIDATION';
              showToast("Cross-departmental sub-theme sent to MD for validation", "var(--purple)");
            }
          }

          const alignmentRecord = {
            employee_id: targetId,
            subtheme_id: stData.id,
            cycle_id: getCycleIdForYear(selectedYear) || "ffffffff-ffff-ffff-ffff-ffffffffffff",
            status: nextStatus
          };
          const { error: alignError } = await supabase.from('employee_subtheme_alignment').insert([alignmentRecord]);
          if (alignError) {
            console.error("⚠️ Alignment auto-link failed:", alignError);
            showToast("Sub-theme created but alignment failed: " + alignError.message, "var(--red)");
          }
        }
      }

      showToast(existingId ? "Revision resubmitted successfully!" : "Sub-theme submitted successfully!", "#22c55e");
      refreshEmployeeDash();
      setRefreshCount(c => c + 1);
      setActiveSubthemeId(null);
      setEditSubthemeId(null);
      setNewDirective({ title: "", description: "", start_date: "", end_date: "" });
    } catch (err) {
      console.error("Submission Error Details:", err);
      // SHOW THE ACTUAL DATABASE MESSAGE TO THE USER
      showToast(`Error: ${err.message || "Database rejected submission"}`, "#ef4444");
    }
  }

  async function handleStrategicThemeUpdate(themeId, formData) {
    if (!formData.title?.trim() || !formData.description?.trim()) return showToast("Title and Description are required", "#cf222e");

    // --- FAIL-SAFE YEAR VALIDATION ---
    const currentYear = new Date().getFullYear();
    const isBad = (d) => d && !String(d).includes(String(currentYear));
    if (isBad(formData.start_date) || isBad(formData.end_date)) {
      showToast(`Restriction: Dates must be for the year ${currentYear}`, "#ef4444");
      return;
    }

    const { error } = await supabase.from('global_themes').update({
      title: formData.title,
      description: formData.description,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: 'pending_hr_approval'
    }).eq('id', themeId);
    if (!error) {
      showToast("Strategic proposal updated and resubmitted", "var(--green)");
      setEditThemeId(null);
      refreshEmployeeDash();
    } else {
      showToast("Error updating proposal", "#cf222e");
    }
  }



  return (
    <div className="page">
      <div className="portal-label">○ EMPLOYEE PORTAL</div>
      <div className="page-title">My <span>Monthly Review</span></div>

      <div className="emp-profile">
        <div className="emp-left">
          <div className="emp-avatar">{getInitials(profile)}</div>
          <div><div className="emp-name">{profile?.first_name} {profile?.last_name}</div><div className="emp-meta">{profile?.employee_id} · {profile?.job_title}</div></div>
        </div>
        <div className="emp-right">
          <Badge cls="yellow" dot>In Progress</Badge>
          <div className="v-stack"><div className="period-label-sm">Review Period</div><div className="period-val">{selectedMonth} {selectedYear}</div></div>
          <div style={{ display: 'flex', gap: 10, marginLeft: 20 }}>
            <select 
              className="input" 
              style={{ width: 80, height: 32, fontSize: 11, padding: '0 8px' }} 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              className="input" 
              style={{ width: 80, height: 32, fontSize: 11, padding: '0 8px' }} 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
            >
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>
      {/* 1. STRATEGIC PILLARS HEADER (ONLY ACTIVE THEMES) */}
      {rootThemes.filter(rt => rt.status === 'approved').length > 0 && (
        <div className="frame" style={{ borderLeft: '4px solid var(--purple)', background: '#fff', marginBottom: 16, padding: '16px 24px', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div className="v-stack" style={{ gap: 4 }}>
            <div className="sec-title" style={{ margin: 0, color: 'var(--purple)', fontSize: 14 }}>| Themes</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 10 }}>Validated Pillars for Year 2026 Alignment.</div>
          </div>
          <div className="h-stack" style={{ gap: 10, marginTop: 16, marginLeft: 10 }}>
            {rootThemes.filter(rt => rt.status === 'approved').map(rt => (
              <div key={rt.id} style={{ padding: '8px 16px', background: 'rgba(124,58,237,0.05)', border: '1px solid var(--purple)', borderRadius: 8, color: 'var(--purple)', fontSize: 12, fontWeight: 700 }}>
                ◈ {rt.title} {profile?.role === 'md' && <span style={{ opacity: 0.6, fontSize: 10, marginLeft: 6 }}>[{rt.department || 'Global'}]</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOD VALIDATION SECTION: Only HOD validates themes proposed by HR */}
      {profile?.role === 'hod' && rootThemes.some(rt => rt.status === 'pending_hod_approval') && (
        <div className="frame" style={{ borderLeft: '4px solid var(--yellow)', background: '#fffbeb', marginBottom: 16, padding: '12px 16px', borderRadius: 12, border: '1px solid #fde68a' }}>
           <div className="sec-title" style={{ color: '#92400e', fontSize: 13, marginBottom: 12 }}>⚠ HR Themes Awaiting Your Approval</div>
           <div className="v-stack" style={{ gap: 10 }}>
             {rootThemes.filter(rt => rt.status === 'pending_hod_approval').map(rt => (
               <div key={rt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 16px', borderRadius: 8, border: '1px solid #fde68a' }}>
                 <div>
                   <div style={{ fontSize: 12, fontWeight: 800 }}>{rt.title}</div>
                   <div style={{ fontSize: 10, color: '#92400e', opacity: 0.8 }}>{rt.description}</div>
                 </div>
                 <div className="h-stack" style={{ gap: 8 }}>
                    <button className="btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: 10, padding: '4px 12px' }} onClick={() => handleStrategicThemeValidation(rt.id, 'reject')}>Reject</button>
                    <button className="btn-primary" style={{ background: '#059669', border: 'none', fontSize: 10, padding: '4px 12px', color: '#fff' }} onClick={() => handleStrategicThemeValidation(rt.id, 'approve')}>Approve & Publish</button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      <div className="frame" style={{ borderLeft: '4px solid var(--cyan)', background: '#fff', marginTop: 12, padding: '12px 20px', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="sec-title" style={{ margin: 0, fontSize: 13, color: 'var(--cyan)' }}>| My Execution Items — Themes</div>
            {(profile?.role === 'manager' || profile?.role === 'hod' || profile?.role === 'hr' || profile?.role === 'md') && (
              <button
                className="btn-link"
                style={{ color: 'var(--cyan)', fontSize: 12, fontWeight: 700, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowCreator(!showCreator)}
              >
                {showCreator ? '✕ Cancel' : '+ Propose Strategic Theme'}
              </button>
            )}
          </div>

          <div className="theme-notice" style={{ background: 'rgba(0,178,236,0.02)', border: '1px solid rgba(0,178,236,0.1)', padding: '8px 12px', borderRadius: 8, fontSize: 11, marginBottom: 12 }}>
            <span style={{ color: 'var(--cyan)' }}>ℹ</span> {(profile?.role === 'manager' || profile?.role === 'hod' || profile?.role === 'hr' || profile?.role === 'md')
              ? "As a manager/HOD/MD/HR, you can propose Strategic Themes. For your own review, align your work to the pillars."
              : "Select a Theme to add your monthly execution details (subthemes)."}
          </div>

          {showCreator && (
            <div className="frame" style={{ background: '#fff', border: '1px solid var(--cyan)', marginBottom: 32, padding: 24, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,178,236,0.1)' }}>
              <div style={{ color: 'var(--cyan)', fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 16 }}>NEW THEME ENTRY</div>
              <div className="v-stack" style={{ gap: 16 }}>
                <div className="v-stack" style={{ gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple)', letterSpacing: 0.5 }}>CATEGORY</div>
                  <input
                    className="input"
                    placeholder="e.g. Strategic Contribution"
                    value={newDirective.category || ""}
                    onChange={e => setNewDirective({ ...newDirective, category: e.target.value })}
                  />
                </div>
                <div className="v-stack" style={{ gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)' }}>THEME TITLE</div>
                  <input className="input" placeholder="e.g. Development Excellence" value={newDirective.title} onChange={e => setNewDirective({ ...newDirective, title: e.target.value })} />
                </div>
                <div className="v-stack" style={{ gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)' }}>DESCRIPTION</div>
                  <textarea className="input" placeholder="What you did and the outcome..." value={newDirective.description} onChange={e => setNewDirective({ ...newDirective, description: e.target.value })} style={{ height: 80 }} />
                </div>
                <button className="btn-primary" style={{ background: 'var(--cyan)', border: 'none', alignSelf: 'flex-start' }} onClick={handleProposeStrategicTheme}>Submit Theme →</button>
              </div>
            </div>
          )}

          {/* RENDER ALIGNED THEMES FROM main_themes TABLE */}
          {/* RENDER THEME CARDS (MATCH IMAGE 2) */}
          {/* RENDER THEME CARDS (MATCH IMAGE 1) */}
          <div className="v-stack" style={{ gap: 10 }}>
            {rootThemes.map(t => (
              <div key={t.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', borderLeft: '4px solid var(--cyan)', padding: '12px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div className="v-stack" style={{ gap: 2 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--purple)', letterSpacing: 1 }}>THEME</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>{t.title} {profile?.role === 'md' && <span style={{ opacity: 0.5, fontSize: 11, fontWeight: 600, marginLeft: 8 }}>[{t.department || 'Global'}]</span>}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                      Category: {t.description?.includes('[') ? t.description.split(']')[0].replace('[', '') : 'Strategic Contribution'} • Origin: <span style={{ color: 'var(--purple)', fontWeight: 800, textTransform: 'uppercase' }}>{t.creator_role || 'System'}</span> • Validation Complete
                    </div>
                  </div>
                  <Badge cls={t.status === 'approved' ? 'green' : 'orange'}>
                    {t.status === 'approved' ? 'Active Strategy' : 'Pending HOD Approval'}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
                   {t.description?.includes(']') ? t.description.split(']')[1].trim() : t.description}
                </div>

                {t.description?.includes('[REVERTED:') && (
                  <div className="v-stack" style={{ gap: 4, marginBottom: 16, padding: '12px 16px', background: 'rgba(255,193,7,0.05)', border: '1px solid var(--yellow)', borderRadius: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--yellow)', letterSpacing: 0.5 }}>HR GUIDANCE / REVISION REQUEST</div>
                    <div style={{ fontSize: 12, color: 'var(--text1)', fontWeight: 600 }}>
                      {t.description.split('[REVERTED:')[1].split(']')[0].trim()}
                    </div>
                  </div>
                )}
                
                {/* SUBTHEME LIST: Filter the alignments/themes for this specific root theme */}
                {themes.filter(sub => (sub.parent_id === t.id || sub.main_theme_id === t.id || sub.global_subthemes?.theme_id === t.id) && isSubthemeInMonth(sub, selectedMonth, selectedYear)).length > 0 ? (
                  <div className="v-stack" style={{ gap: 8 }}>
                    {themes.filter(sub => (sub.parent_id === t.id || sub.main_theme_id === t.id || sub.global_subthemes?.theme_id === t.id) && isSubthemeInMonth(sub, selectedMonth, selectedYear)).map(sub => (
                        <div key={sub.id} className="execution-item" style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
                          {/* TOP: TITLE */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{sub.title || sub.global_subthemes?.title}</div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                              {(canEdit() || sub.status === 'REVERTED' || sub.status === 'REJECTED') && (
                                <button 
                                  className="badge badge-blue" 
                                  style={{ cursor: 'pointer', border: 'none' }}
                                  onClick={() => {
                                    setEditSubthemeId(sub.id);
                                    setActiveSubthemeId(sub.global_subthemes?.theme_id);
                                    setNewDirective({
                                      title: sub.title || sub.global_subthemes?.title,
                                      description: sub.description || sub.global_subthemes?.description,
                                      category: sub.category || "Business Impact",
                                      start_date: sub.start_date || today,
                                      end_date: sub.end_date || today
                                    });
                                  }}
                                >
                                  ✎ Edit & Resubmit
                                </button>
                              )}
                              <Badge cls={
                                sub.status === 'APPROVED' ? 'green' : 
                                (sub.status === 'REJECTED' ? 'red' : 
                                (sub.status === 'REVERTED' ? 'yellow' : 
                                (sub.status === 'PENDING_MD_VALIDATION' ? 'purple' : 
                                (sub.status === 'PENDING_HOD_VALIDATION' ? 'blue' :
                                (sub.status === 'PENDING_HR_VALIDATION' ? 'cyan' : 'yellow')))))
                              }>
                                {sub.status === 'APPROVED' ? 'Approved' : 
                                (sub.status === 'REJECTED' ? 'Rejected' : 
                                (sub.status === 'REVERTED' ? 'Reverted' : 
                                (sub.status === 'PENDING_MD_VALIDATION' ? 'Pending (MD)' : 
                                (sub.status === 'PENDING_HOD_VALIDATION' ? 'Pending (HOD)' :
                                (sub.status === 'PENDING_HR_VALIDATION' ? 'Pending (HR)' : 'Pending')))))}
                              </Badge>
                            </div>
                          </div>

                          {/* MIDDLE: DESCRIPTION */}
                          <div style={{ fontSize: 13, color: 'var(--text2)', paddingLeft: 0 }}>
                            {(sub.description || sub.global_subthemes?.description)?.includes(']') 
                              ? (sub.description || sub.global_subthemes?.description).split(']')[1].trim() 
                              : (sub.description || sub.global_subthemes?.description)}
                          </div>

                          {sub.status === 'REVERTED' && (
                            <div className="v-stack" style={{ gap: 4, marginTop: 8, padding: '10px 14px', background: 'rgba(255,193,7,0.05)', border: '1px solid var(--yellow)', borderRadius: 8 }}>
                              <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--yellow)', letterSpacing: 0.5 }}>MANAGER GUIDANCE / FEEDBACK</div>
                              <div style={{ fontSize: 12, color: 'var(--text1)', fontWeight: 600 }}>{sub.manager_feedback || "Please review and revise your execution plan."}</div>
                            </div>
                          )}

                          {/* DIVIDER */}
                          <div style={{ height: 1, background: '#f1f5f9', marginTop: 4 }} />

                          {/* FOOTER: METADATA */}
                          <div style={{ display: 'flex', gap: 20, paddingLeft: 0, marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
                              <span style={{ fontSize: 14 }}>○</span> Period: {
                                (() => {
                                  const desc = sub.description || sub.global_subthemes?.description;
                                  if (!desc || !desc.includes('|')) return 'Select Period →';
                                  const datePart = desc.split('[')[1].split('|')[0];
                                  const dates = datePart.split(' - ').map(d => d.trim()).filter(Boolean);
                                  if (dates.length < 2) return datePart.replace(/-/g, ' → ');
                                  return `${formatDate(dates[0])} → ${formatDate(dates[1])}`;
                                })()
                              }
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
                              <span style={{ fontSize: 14 }}>○</span> Submitted {
                                (() => {
                                  const desc = sub.description || sub.global_subthemes?.description;
                                  if (!desc || !desc.includes('|')) return 'Just now';
                                  const subDate = desc.split('|')[1].split(']')[0].trim();
                                  return formatDate(subDate);
                                })()
                              }
                            </div>
                          </div>
                        </div>
                    ))}
                    </div>
                  ) : (
                    <div style={{ padding: '8px 12px', border: '1px dashed rgba(0,178,236,0.3)', borderRadius: 10, textAlign: 'center', background: 'rgba(0,178,236,0.01)' }}>
                       <div style={{ fontSize: 10, opacity: 0.5 }}>○ No execution items added yet for this pillar.</div>
                    </div>
                  )}
                </div>
            ))}
          </div>
        </div>

      {/* BOTTOM ALIGNMENT SECTION (OPEN TO ALL ROLES) */}
      {(profile?.role === 'employee' || profile?.role === 'manager' || profile?.role === 'hr' || profile?.role === 'hod') && (
        <div className="frame" style={{ border: '1px dashed rgba(0,178,236,0.4)', background: 'transparent', marginTop: 16, padding: '12px 16px', borderRadius: 12 }}>
          <div className="sec-title" style={{ fontSize: 13, color: 'var(--cyan)', marginBottom: 8 }}>| Sub Themes</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>If you have work this month that aligns with a different pillar, pick it below.</div>
          <div className="h-stack" style={{ gap: 12, flexWrap: 'wrap' }}>
            {rootThemes.map(rt => (
              <button
                key={rt.id}
                className="btn-outline"
                style={{ color: 'var(--cyan)', border: '1px solid var(--cyan)', padding: '10px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'transparent' }}
                onClick={() => {
                  setActiveSubthemeId(rt.id);
                  setNewDirective({ title: "", description: "" });
                }}
              >
                + Align to {rt.title}
              </button>
            ))}
          </div>
        </div>
      )}

        {activeSubthemeId && (
            <div className="subtheme-form-container" style={{ background: 'rgba(0,178,236,0.03)', padding: 24, borderRadius: 12, border: '1px solid rgba(0,178,236,0.2)', marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ color: 'var(--cyan)', fontWeight: 800, fontSize: 11 }}>
                  {editSubthemeId ? 'REVISING SUB-THEME' : 'ADD NEW SUB-THEME'}
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }} onClick={() => { setActiveSubthemeId(null); setEditSubthemeId(null); }}>✕ Cancel</button>
              </div>

              <div className="v-stack" style={{ gap: 16 }}>
                <div className="v-stack" style={{ gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)' }}>TITLE</div>
                  <input
                    className="input"
                    placeholder="e.g., Q2 Architecture Refactor..."
                    value={newDirective.title}
                    onChange={e => setNewDirective({ ...newDirective, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="v-stack" style={{ gap: 6, flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)' }}>FROM DATE</div>
                    <input
                      type="date"
                      className="input"
                      min={minDate}
                      max={maxDate}
                      value={newDirective.start_date}
                      onChange={e => setNewDirective(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="v-stack" style={{ gap: 6, flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)' }}>TO DATE</div>
                    <input
                      type="date"
                      className="input"
                      min={minDate}
                      max={maxDate}
                      value={newDirective.end_date}
                      onChange={e => setNewDirective(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="v-stack" style={{ gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)' }}>DETAILED NOTES</div>
                  <textarea
                    className="input"
                    style={{ height: 100 }}
                    placeholder="Specify the target and deliverables..."
                    value={newDirective.description}
                    onChange={e => setNewDirective({ ...newDirective, description: e.target.value })}
                  />
                </div>

                <div className="h-stack" style={{ gap: 12, marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: '10px 24px' }} onClick={() => { setActiveSubthemeId(null); setEditSubthemeId(null); }}>Cancel</button>
                  <button
                    className="btn-primary"
                    style={{ background: 'var(--cyan)', border: 'none', padding: '10px 24px', color: '#fff' }}
                    onClick={() => handleSubthemeSubmit(activeSubthemeId, newDirective, activeUser, editSubthemeId)}
                  >
                    {editSubthemeId ? 'Save Revisions →' : 'Submit Sub-theme →'}
                  </button>
                </div>
              </div>
            </div>
          )}



      {/* SECTION: TEAM ALIGNMENT TRACKER (MANAGERS/HOD/HR/MD - THE AUTHORITY CONSOLE) - REMOVED TO CONSOLIDATE VALIDATION UNDER THEME VALIDATION PENDING */}

      {(profile?.role === 'employee' || profile?.role === 'manager' || profile?.role === 'hr' || profile?.role === 'hod') && themes.length > 0 && (
        <div className="frame" style={{ borderLeft: '4px solid var(--cyan)', background: '#fff', marginTop: 16, padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="sec-title" style={{ color: 'var(--cyan)', fontSize: 13, margin: 0 }}>| Monthly Review Support Evidence</div>
            {monthlyEvidence.rating_status === 'RETURNED' && (
              <Badge cls="yellow">↩ Needs Revision</Badge>
            )}
          </div>
          
          {monthlyEvidence.rating_status === 'RETURNED' && monthlyEvidence.manager_comment && (
            <div className="frame" style={{ marginBottom: 20, background: 'rgba(255,193,7,0.05)', border: '1px solid var(--yellow)', padding: '12px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--yellow)', marginBottom: 6, letterSpacing: 0.5 }}>SUPERIOR INPUT / GUIDANCE</div>
              <div style={{ fontSize: 12, color: 'var(--text1)', fontWeight: 600, lineHeight: 1.5 }}>
                {monthlyEvidence.manager_comment}
              </div>
            </div>
          )}

          {monthlyEvidence.submitted_at && monthlyEvidence.rating_status === 'PENDING' && !editSubmittedEvidence ? (
            <div className="v-stack" style={{ gap: 16, alignItems: 'center', textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 32 }}>✓</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>SUPPORT EVIDENCE SUBMITTED</div>
              <p style={{ fontSize: 11, color: 'var(--text2)', maxWidth: 450, margin: '0 auto', lineHeight: 1.6 }}>
                Your review support evidence for <strong>{selectedMonth} {selectedYear}</strong> has been submitted successfully and is currently pending review by your manager.
              </p>
              
              <div className="frame" style={{ background: 'var(--bg2)', padding: '12px 16px', borderRadius: 8, width: '100%', maxWidth: 500, textAlign: 'left', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text3)', marginBottom: 8, letterSpacing: 0.5 }}>SUBMITTED DETAILS</div>
                {monthlyEvidence.achievements && (
                  <div style={{ fontSize: 11, marginBottom: 8 }}><strong>Key Achievements:</strong> {monthlyEvidence.achievements}</div>
                )}
                {monthlyEvidence.blockers && (
                  <div style={{ fontSize: 11, marginBottom: 8 }}><strong>Challenges/Blockers:</strong> {monthlyEvidence.blockers}</div>
                )}
                {monthlyEvidence.proofPoints && (
                  <div style={{ fontSize: 11, marginBottom: 8 }}><strong>Evidence & Proof Points:</strong> {monthlyEvidence.proofPoints}</div>
                )}
                {monthlyEvidence.attachments?.length > 0 && (
                  <div style={{ fontSize: 11, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <strong>Attachments:</strong>
                    {monthlyEvidence.attachments.map((file, idx) => (
                      <span key={idx} style={{ background: 'rgba(0,178,236,0.1)', color: 'var(--cyan)', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>📎 {file.name}</span>
                    ))}
                  </div>
                )}
              </div>

              <button 
                className="btn-outline" 
                style={{ color: 'var(--cyan)', border: '1px solid var(--cyan)', padding: '8px 20px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: 'transparent', cursor: 'pointer', marginTop: 8 }}
                onClick={() => setEditSubmittedEvidence(true)}
              >
                ✎ Edit Submitted Evidence
              </button>
            </div>
          ) : (
            <>
              <div className="v-stack" style={{ gap: 12 }}>
            <div style={{ padding: '8px 12px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--frame-border)', marginBottom: 8 }}>
              <div className="evidence-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--text2)', marginBottom: 8 }}>THIS REVIEW COVERS YOUR ACTIVE EXECUTION ITEMS:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {themes
                  .filter(t => t.subtheme_id && (t.global_subthemes?.title || t.title))
                  .length > 0 ? (
                  themes
                    .filter(t => t.subtheme_id && (t.global_subthemes?.title || t.title))
                    .map(t => (
                      <div key={t.id} style={{ 
                        background: 'var(--cyan)', 
                        color: '#fff', 
                        fontSize: 10, 
                        fontWeight: 700, 
                        padding: '4px 10px', 
                        borderRadius: 12 
                      }}>
                        ✓ {t.global_subthemes?.title || t.title}
                      </div>
                    ))
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>No active execution items linked to this month.</div>
                )}
              </div>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--frame-border)', marginBottom: 8 }}>
              <div className="evidence-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--text2)', marginBottom: 4 }}>KEY ACHIEVEMENTS THIS MONTH</div>
              <textarea
                className="evidence-input"
                style={{ padding: '6px 12px', fontSize: 11, width: '100%', border: '1px solid var(--border)', borderRadius: 6, background: '#fff' }}
                placeholder="Main contributions and project outcomes..."
                value={monthlyEvidence.achievements}
                readOnly={monthlyEvidence.rating_status === 'APPROVED' || profile?.id !== activeUser}
                onChange={(e) => setMonthlyEvidence(prev => ({ ...prev, achievements: e.target.value }))}
                rows={1}
              />
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--frame-border)', marginBottom: 8 }}>
              <div className="evidence-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--text2)', marginBottom: 4 }}>CHALLENGES / BLOCKERS</div>
              <textarea
                className="evidence-input"
                style={{ padding: '6px 12px', fontSize: 11, width: '100%', border: '1px solid var(--border)', borderRadius: 6, background: '#fff' }}
                placeholder="Any blockers faced..."
                value={monthlyEvidence.blockers}
                readOnly={monthlyEvidence.rating_status === 'APPROVED' || profile?.id !== activeUser}
                onChange={(e) => setMonthlyEvidence(prev => ({ ...prev, blockers: e.target.value }))}
                rows={1}
              />
            </div>

            {(profile?.role === 'employee' || profile?.role === 'manager' || profile?.role === 'hr') && (
              <div style={{ padding: '8px 12px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--frame-border)', marginBottom: 8 }}>
                <div className="evidence-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--text2)', marginBottom: 4 }}>LEARNING & DEVELOPMENT POINTS</div>
                <textarea
                  className="evidence-input"
                  style={{ padding: '6px 12px', fontSize: 11, width: '100%', border: '1px solid var(--border)', borderRadius: 6, background: '#fff' }}
                  placeholder="New skills acquired or training completed..."
                  value={monthlyEvidence.learning}
                  readOnly={monthlyEvidence.rating_status === 'APPROVED' || profile?.id !== activeUser}
                  onChange={(e) => setMonthlyEvidence(prev => ({ ...prev, learning: e.target.value }))}
                  rows={1}
                />
              </div>
            )}

            <div style={{ padding: '8px 12px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--frame-border)', marginBottom: 0 }}>
              <div className="evidence-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--text2)', marginBottom: 4 }}>EVIDENCE & PROOF POINTS</div>
              <textarea
                className="evidence-input"
                style={{ padding: '6px 12px', fontSize: 11, width: '100%', border: '1px solid var(--border)', borderRadius: 6, background: '#fff' }}
                placeholder="Behavioural examples, quality metrics, specific delivery proof..."
                value={monthlyEvidence.proofPoints}
                readOnly={monthlyEvidence.rating_status === 'APPROVED' || profile?.id !== activeUser}
                onChange={(e) => setMonthlyEvidence(prev => ({ ...prev, proofPoints: e.target.value }))}
                rows={1}
              />
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--frame-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: monthlyEvidence.attachments.length > 0 ? 8 : 0 }}>
              <div className="v-stack">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text2)' }}>ATTACHMENTS</div>
                  {monthlyEvidence.attachments.length > 0 && (
                    <div style={{ background: 'var(--cyan)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>
                      {monthlyEvidence.attachments.length} {monthlyEvidence.attachments.length === 1 ? 'FILE' : 'FILES'}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>Upload photos, PDF proof, or screenshots</div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                className="badge badge-cyan"
                disabled={monthlyEvidence.rating_status === 'APPROVED'}
                style={{ cursor: monthlyEvidence.rating_status === 'APPROVED' ? 'not-allowed' : 'pointer', padding: '8px 16px', opacity: monthlyEvidence.rating_status === 'APPROVED' ? 0.6 : 1 }}
                onClick={() => fileInputRef.current.click()}
              >
                + Add Attachment
              </button>
            </div>

            {monthlyEvidence.attachments.length > 0 && (
              <div className="v-stack" style={{ gap: 8, padding: '12px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                {monthlyEvidence.attachments.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ fontSize: 12, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                    >
                      📎 {file.name}
                    </a>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 10, cursor: monthlyEvidence.rating_status === 'APPROVED' ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: monthlyEvidence.rating_status === 'APPROVED' ? 0.5 : 1 }}
                      disabled={monthlyEvidence.rating_status === 'APPROVED'}
                      onClick={() => handleRemoveAttachment(idx)}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              className="btn-outline"
              disabled={hasJustSubmitted || !!monthlyEvidence.submitted_at}
              style={{ 
                padding: '10px 24px', 
                fontSize: 13,
                opacity: (hasJustSubmitted || !!monthlyEvidence.submitted_at) ? 0.5 : 1,
                cursor: (hasJustSubmitted || !!monthlyEvidence.submitted_at) ? 'not-allowed' : 'pointer'
              }}
              onClick={() => {
                setHasJustSubmitted(true);
                setMonthlyEvidence({
                  achievements: "",
                  blockers: "",
                  learning: "",
                  proofPoints: "",
                  attachments: [],
                  subtheme_id: "",
                  rating_status: "PENDING",
                  manager_comment: "",
                  submitted_at: null
                });
              }}
            >
              Clear Form
            </button>
            <button
              className="btn-primary"
              disabled={hasJustSubmitted || !!monthlyEvidence.submitted_at || monthlyEvidence.rating_status === 'APPROVED'}
              style={{ 
                padding: '10px 24px', 
                background: (hasJustSubmitted || !!monthlyEvidence.submitted_at || monthlyEvidence.rating_status === 'APPROVED') ? 'var(--bg3)' : 'var(--cyan)', 
                borderColor: (hasJustSubmitted || !!monthlyEvidence.submitted_at || monthlyEvidence.rating_status === 'APPROVED') ? 'var(--border)' : 'var(--cyan)',
                cursor: (hasJustSubmitted || !!monthlyEvidence.submitted_at || monthlyEvidence.rating_status === 'APPROVED') ? 'not-allowed' : 'pointer',
                opacity: (hasJustSubmitted || !!monthlyEvidence.submitted_at || monthlyEvidence.rating_status === 'APPROVED') ? 0.6 : 1
              }}
              onClick={handleEvidenceSubmit}
            >
              {(hasJustSubmitted || !!monthlyEvidence.submitted_at) ? 'Submitted for this Month' : monthlyEvidence.rating_status === 'APPROVED' ? 'Cycle Complete' : 'Submit Monthly Evidence →'}
            </button>
          </div>
          </>
          )}
        </div>
      )}

      <div className="frame" style={{ borderLeft: '4px solid var(--cyan)', background: '#fff', marginTop: 16, padding: '12px 16px', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div className="sec-title" style={{ color: 'var(--cyan)', fontSize: 13, marginBottom: 12 }}>| My Review History</div>

        <table className="hist-table-v3" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', paddingBottom: 16 }}>Period</th>
              <th style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', paddingBottom: 16 }}>Result</th>
              <th style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', paddingBottom: 16 }}>Themes</th>
              <th style={{ textAlign: 'left', fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', paddingBottom: 16 }}>Manager Feedback</th>
            </tr>
          </thead>
          <tbody>
            {myReviews.filter(r => r.employee_id === activeUser).length > 0 ? (
              myReviews.filter(r => r.employee_id === activeUser).sort((a,b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)).map((row, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid var(--bg3)' }}>
                  <td style={{ padding: '10px 0', fontWeight: 700, fontSize: 12, color: '#334155', textTransform: 'capitalize' }}>
                    {row.submitted_at ? new Date(row.submitted_at).toLocaleString('default', { month: 'long', year: 'numeric' }) : row.cycle_id}
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'center' }}>
                     <div style={{ 
                       display: 'inline-block', 
                       padding: '3px 12px', 
                       borderRadius: 4, 
                       border: `1px solid ${row.overall_result === 'YES' ? 'var(--green)' : row.overall_result === 'NO' ? 'var(--red)' : 'var(--border)'}`, 
                       color: row.overall_result === 'YES' ? 'var(--green)' : row.overall_result === 'NO' ? 'var(--red)' : 'var(--text3)', 
                       fontSize: 10, 
                       fontWeight: 900, 
                       background: row.overall_result === 'YES' ? 'rgba(34,197,94,0.02)' : row.overall_result === 'NO' ? 'rgba(239,68,68,0.02)' : '#f8fafc', 
                       letterSpacing: 0.5 
                     }}>{row.overall_result || 'PENDING'}</div>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'center' }}>
                     <div style={{ 
                       display: 'inline-block', 
                       padding: '3px 10px', 
                       borderRadius: 4, 
                       border: '1px solid #e2e8f0', 
                       color: row.rating_status === 'RETURNED' ? 'var(--yellow)' : '#64748b', 
                       fontSize: 10, 
                       fontWeight: 700, 
                       background: row.rating_status === 'RETURNED' ? 'rgba(255,193,7,0.05)' : '#f8fafc' 
                     }}>
                       {row.rating_status === 'RETURNED' ? '↩ Returned' : '✓ Submitted'}
                     </div>
                  </td>
                  <td style={{ padding: '10px 0', fontSize: 11, color: '#475569', fontWeight: 500 }}>
                    <span style={{ marginRight: 6, opacity: 0.8 }}>
                      {row.overall_result === 'YES' ? '👍' : row.overall_result === 'NO' ? '👎' : '⏳'}
                    </span> 
                    {row.manager_comment || "Awaiting manager feedback..."}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: 12 }}>No review history found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-row" style={{ display: 'flex', gap: 16, marginTop: 32, alignItems: 'center', paddingBottom: 60 }}>
        <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontWeight: 700 }} onClick={() => showToast('💾 Draft saved successfully', 'var(--cyan)')}>
          <span style={{ fontSize: 16 }}>💾</span> Save Draft
        </button>
        <button
          className="btn-primary"
          disabled={monthlyEvidence.rating_status === 'PENDING' || monthlyEvidence.rating_status === 'APPROVED'}
          style={{ 
            padding: '12px 32px', 
            background: (monthlyEvidence.rating_status === 'PENDING' || monthlyEvidence.rating_status === 'APPROVED') ? 'var(--bg3)' : 'var(--cyan)', 
            border: 'none', 
            borderRadius: 8, 
            fontWeight: 700, 
            fontSize: 13,
            cursor: (monthlyEvidence.rating_status === 'PENDING' || monthlyEvidence.rating_status === 'APPROVED') ? 'not-allowed' : 'pointer',
            opacity: (monthlyEvidence.rating_status === 'PENDING' || monthlyEvidence.rating_status === 'APPROVED') ? 0.6 : 1
          }}
          onClick={async () => {
            if (!monthlyEvidence.proofPoints?.trim() && !monthlyEvidence.learning?.trim()) {
              showToast("Please provide evidence or learning points before submitting.", "var(--red)");
              return;
            }
            // 1. Submit themes for validation
            const draftIds = themes.filter(t => t.status === 'draft').map(t => t.id);
            if (draftIds.length > 0) {
              await supabase.from('global_themes').update({ status: 'submitted_to_manager' }).in('id', draftIds);
            }
            
            // 2. Ensure a monthly_review record exists so it shows in history
            const { data: profileData } = await supabase.from('profiles').select('manager_id').eq('id', activeUser).single();
            
            let targetManagerId = profileData?.manager_id;
            if (!targetManagerId) {
              const { data: hods } = await supabase.from('profiles').select('id').eq('role', 'hod').limit(1);
              targetManagerId = hods?.[0]?.id;
            }

            await supabase.from('monthly_reviews').insert({
               employee_id: activeUser,
               cycle_id: ACTIVE_CYCLE?.id,
               review_month: selectedMonth,
               manager_id: targetManagerId,
               rating_status: 'PENDING'
            });

            showToast('✓ Monthly review submitted to manager', 'var(--green)');
            refreshEmployeeDash();
            fetchReviewsHistory(); // Ensure history updates immediately
          }}
        >
          {monthlyEvidence.rating_status === 'PENDING' ? 'Submission Pending...' : 
           monthlyEvidence.rating_status === 'APPROVED' ? 'Cycle Complete' : 'Submit for Review →'}
        </button>
      </div>
    </div>
  );
}

// ── MANAGER PORTAL ──
function ManagerPortal({ profile, activeUser, showToast }) {
  const [team, setTeam] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [teamThemes, setTeamThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null);
  const [binaryInputs, setBinaryInputs] = useState({ themeResults: {}, comment: "" });
  const [returningId, setReturningId] = useState(null);
  const [superiorInput, setSuperiorInput] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase());
  const [viewMode, setViewMode] = useState('direct'); // 'direct' or 'all'

  const [assigningToMemberId, setAssigningToMemberId] = useState(null);
  const [rootThemes, setRootThemes] = useState([]);
  const [newSubtheme, setNewSubtheme] = useState({ title: "", description: "", start_date: "", end_date: "", parent_id: "" });
  const [returningThemeId, setReturningThemeId] = useState(null);
  const [themeFeedback, setThemeFeedback] = useState("");
  const [isValidationCollapsed, setIsValidationCollapsed] = useState(false);
  const [proposedTheme, setProposedTheme] = useState({ title: "", description: "" });

  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01-01`;
  const maxDate = `${currentYear}-12-31`;

  useEffect(() => {
    fetchManagerData();
    fetchRootThemes();
  }, [activeUser, profile, viewMode, selectedMonth, selectedYear]);

  async function handleReturnToEmployee(reviewId) {
    if (!superiorInput.trim()) {
      showToast("Please provide guidance", "var(--red)");
      return;
    }
    
    console.log("↩ RETURNING REVIEW:", reviewId, "WITH INPUT:", superiorInput);
    
    const { error } = await supabase
      .from('monthly_reviews')
      .update({ 
        rating_status: 'RETURNED',
        manager_comment: superiorInput 
      })
      .eq('id', reviewId);

    if (!error) {
      showToast("Returned with guidance", "var(--green)");
      setReturningId(null);
      setSuperiorInput("");
      fetchManagerData();
    } else {
      console.error("Error returning review:", error);
      showToast("Error updating review", "var(--red)");
    }
  }

  async function fetchRootThemes() {
    const { data } = await supabase.from('global_themes').select('*').eq('is_active', true);
    setRootThemes(data || []);
  }

  async function fetchManagerData() {
    setLoading(true);
    try {
      // 1. Fetch data for the validation section (ALWAYS ROLE-BASED)
      let validationProfiles = [];
      const userRole = profile?.role?.toLowerCase() || 'employee';

      
      if (userRole === 'hr') {
        const { data } = await supabase.from('profiles').select('*');
        validationProfiles = data || [];
      } else {
        // Use hierarchy for HOD and Manager to see ALL pending themes below them
        const { data: hierarchy } = await supabase.rpc('get_reports_hierarchy', { manager_uuid: activeUser });
        if (hierarchy && hierarchy.length) {
          const ids = hierarchy.map(h => h.profile_id);
          const { data } = await supabase.from('profiles').select('*').in('id', ids);
          validationProfiles = data || [];
        } else {
          // Fallback to direct reports
          const { data } = await supabase.from('profiles').select('*').eq('manager_id', activeUser);
          validationProfiles = data || [];
        }
      }

      // 2. Fetch data for the team member list (RESPECTS VIEWMODE TOGGLE)
      let listProfiles = [];
      if (viewMode === 'all') {
        const { data: hierarchy, error: hError } = await supabase.rpc('get_reports_hierarchy', { manager_uuid: activeUser });
        if (!hError && hierarchy?.length) {
          const ids = hierarchy.map(h => h.profile_id);
          const { data } = await supabase.from('profiles').select('*').in('id', ids);
          listProfiles = data?.filter(p => p.id !== activeUser) || [];
          
          // Diagnostic: Check columns of the first review found
          const { data: firstRev } = await supabase.from('monthly_reviews').select('*').limit(1);
          if (firstRev && firstRev[0]) {
            const keys = Object.keys(firstRev[0]).join(', ');
            showToast("Manager DB Columns: " + keys, "var(--purple)");
          }
        } else {
          const { data } = await supabase.from('profiles').select('*'); // Fallback to all for HR/HOD
          listProfiles = data?.filter(p => p.id !== activeUser) || [];
        }
      } else {
        const { data } = await supabase.from('profiles').select('*').eq('manager_id', activeUser);
        listProfiles = data || [];
      }
      
      setTeam(listProfiles);

      // 3. Fetch alignments for the validation profiles
      const valIds = validationProfiles.map(p => p.id);
      if (valIds.length) {
        const { data: alignments } = await supabase.from('employee_subtheme_alignment').select('*, global_subthemes(*)').in('employee_id', valIds);
        const mappedThemes = alignments?.map(a => ({
          id: a.id,
          employee_id: a.employee_id,
          title: a.global_subthemes?.title,
          description: a.global_subthemes?.description,
          status: (a.status === 'PENDING' || a.status === 'PENDING_HR_VALIDATION' || a.status === 'PENDING_HOD_VALIDATION' || a.status === 'PENDING_MD_VALIDATION') ? 'submitted_to_manager' : (a.status === 'APPROVED' ? 'approved' : 'RETURNED'),
          subtheme_id: a.subtheme_id,
          parent_id: a.global_subthemes?.theme_id
        })) || [];
        setTeamThemes(mappedThemes);
      } else {
        setTeamThemes([]);
      }

      // 4. Fetch reviews for the list profiles
      const listIds = listProfiles.map(p => p.id);
      if (listIds.length) {
        const { data: revs } = await supabase.from('monthly_reviews').select('*').in('employee_id', listIds);
        setReviews(revs || []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Error fetching manager data:", err);
      showToast("Error loading team data", "var(--red)");
    } finally {
      setLoading(false);
    }
  }

  async function handleReviewSubmit(employeeId) {
    const results = binaryInputs.themeResults || {};
    const themeValues = typeof results === 'object' ? Object.values(results) : [];
    const yesCount = themeValues.filter(v => v === 'YES').length;
    const noCount = themeValues.filter(v => v === 'NO').length;
    const neutralCount = themeValues.filter(v => v === 'NEUTRAL').length;

    // DYNAMIC CALCULATION: Follow user's custom Yes/No/Neutral majority logic:
    // If yesCount > noCount => YES
    // If noCount > yesCount => NO
    // If yesCount === noCount => NEUTRAL
    let overall = 'NEUTRAL';
    if (yesCount > noCount) {
      overall = 'YES';
    } else if (noCount > yesCount) {
      overall = 'NO';
    } else {
      overall = 'NEUTRAL';
    }

    let existingReview = reviews.filter(r => r.employee_id === employeeId).sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))[0];

    // Fallback: Fetch directly if state is out of sync
    if (!existingReview) {
       const { data: directData } = await supabase.from('monthly_reviews').select('*').eq('employee_id', employeeId).order('submitted_at', { ascending: false }).limit(1);
       if (directData?.[0]) existingReview = directData[0];
    }

    if (!existingReview?.id) {
      showToast("No active evidence submission found for this employee.", "var(--red)");
      return;
    }

    const reviewRecord = {
      overall_result: overall,
      manager_comment: binaryInputs.comment || "",
      theme_results: results,
      submitted_at: new Date().toISOString()
    };

    console.log("📤 Submitting Monthly Review:", reviewRecord);

    const { error } = await supabase.from('monthly_reviews').update(reviewRecord).eq('id', existingReview.id);

    if (!error) {
      showToast(`Review submitted successfully`, "var(--green)");
      setActivePanel(null);
      fetchManagerData();
    } else {
      console.error("❌ Review Submission Error:", error, error.hint, error.details);
      showToast(`Error: ${error.message || "Check console for details"}`, "var(--red)");
    }
  }

  async function handleProposeGlobalTheme() {
    if (!proposedTheme.title?.trim() || !proposedTheme.description?.trim()) {
      showToast("Please provide both a Title and Description.", "var(--red)");
      return;
    }
    const { error } = await supabase.from('global_themes').insert([{
      ...proposedTheme,
      created_by: activeUser,
      status: profile?.role === 'md' ? 'approved' : 'pending_hod_validation',
      is_active: profile?.role === 'md' ? true : false,
      cycle_id: getCycleIdForYear(CURRENT_YEAR),
      department: profile?.department || null
    }]);
    
    if (!error) {
      showToast("Global theme proposed for HOD approval", "var(--green)");
      setProposedTheme({ title: "", description: "" });
    } else {
      showToast("Error proposing theme", "var(--red)");
    }
  }

  async function handleThemeAction(themeId, action, feedback = "") {
    const statusMap = { 'approve': 'approved', 'return': 'REVERTED', 'reject': 'REVERTED' };
    const alignStatusMap = { 'approve': 'APPROVED', 'return': 'REVERTED', 'reject': 'REJECTED' }; 
    const colorMap = { 'approve': 'var(--green)', 'return': 'var(--yellow)', 'reject': 'var(--red)' };

    // Find the theme in state to see if it's an alignment record
    const theme = teamThemes.find(t => t.id === themeId);
    
    // Determine which table to update
    const isAlignment = !!theme?.subtheme_id;
    const table = isAlignment ? 'employee_subtheme_alignment' : 'global_themes';
    const status = isAlignment ? alignStatusMap[action] : statusMap[action];

    const updatePayload = { status };
    if (feedback) {
      if (isAlignment) updatePayload.manager_feedback = feedback;
      else updatePayload.description = `[REVERTED: ${feedback}] ` + (theme.description || "");
    }

    console.log(`🎯 Action: ${action} | Table: ${table} | ID: ${themeId}`, updatePayload);
    const { error } = await supabase.from(table).update(updatePayload).eq('id', themeId);

    if (!error) {
      const msg = action === 'reject' ? "Returned for edit" : `Successfully ${action}ed`;
      showToast(msg, colorMap[action]);
      fetchManagerData();
    } else {
      console.error("❌ Theme Action Error:", error);
      showToast(`Error: ${error.message || "Update failed"}`, "var(--red)");
    }
  }

  const completedCount = reviews.length;
  const pendingCount = team.length - completedCount;
  const yesRate = completedCount > 0 ? Math.round((reviews.filter(r => r.overall_result === 'YES').length / completedCount) * 100) : 0;
  const AVATAR_COLORS = ['#008CC8', '#8250df', '#cf222e', '#1a7f37', '#9a6700', '#bc4c00'];

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      <div className="portal-label">◈ MANAGER PORTAL</div>
      <div className="page-title">Team <span>Reviews</span></div>
      <div className="page-sub">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · {profile?.first_name} {profile?.last_name} · {team.length} Direct Reports</div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard cls="blue" label="Direct Reports" val={team.filter(p => p.manager_id === activeUser).length} valCls="cyan" note="Staff reporting to you" />
        <StatCard cls="purple" label="Indirect Reports" val={team.filter(p => p.manager_id !== activeUser).length} valCls="purple" note="Wider department hierarchy" />
        <StatCard cls="blue" label="Completed" val={completedCount} valCls="green" note={`For ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`} />
        <StatCard cls="blue" label="Team YES Rate" val={`${yesRate}%`} valCls="cyan" note="Overall monthly result" />
      </div>

      <div className="h-stack" style={{ gap: 12, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>MONTH:</div>
        <select 
          className="input" 
          style={{ width: 100, height: 36, borderRadius: 8 }}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div style={{ fontSize: 12, fontWeight: 700, marginLeft: 12 }}>YEAR:</div>
        <select 
          className="input" 
          style={{ width: 100, height: 36, borderRadius: 8 }}
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <button className="badge badge-blue" style={{ marginLeft: 12 }} onClick={() => fetchManagerData()}>↻ Refresh</button>
        {(profile?.role === 'hod' || profile?.role === 'manager' || !profile?.manager_id) && (
          <div style={{ fontSize: 12, fontWeight: 700, marginLeft: 'auto' }}>
            VIEWING: <select 
              className="input" 
              style={{ 
                width: 220, 
                height: 38, 
                fontSize: 12, 
                padding: '0 12px', 
                borderRadius: 8,
                background: '#fff',
                border: '2px solid var(--cyan)',
                color: '#1a1f2e',
                fontWeight: 700,
                cursor: 'pointer',
                appearance: 'auto'
              }} 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="direct" style={{ color: '#1a1f2e' }}>Direct Reports Only</option>
              <option value="all" style={{ color: '#1a1f2e' }}>Full Reporting Hierarchy</option>
            </select>
          </div>
        )}
      </div>

      <div className="frame" style={{ border: '1px solid var(--orange)', background: 'rgba(188,76,0,0.02)', padding: isValidationCollapsed ? '12px 24px' : 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isValidationCollapsed ? 0 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sec-title" style={{ color: 'var(--orange)', margin: 0 }}>Theme Validations Pending</div>
            <button 
              onClick={() => setIsValidationCollapsed(!isValidationCollapsed)}
              style={{ background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontSize: 16, padding: 4 }}
            >
              {isValidationCollapsed ? '▲' : '▼'}
            </button>
          </div>
          {isValidationCollapsed && (
            <div className="badge badge-orange" style={{ fontSize: 10 }}>
              {teamThemes.filter(t => (t.status === 'pending_review' || t.status === 'pending_hr_approval' || t.status === 'submitted_to_manager') && isSubthemeInMonth(t, selectedMonth, selectedYear)).length} Items
            </div>
          )}
        </div>
        {!isValidationCollapsed && (
          <div className="v-stack" style={{ gap: 12 }}>
          {teamThemes.some(t => (t.status === 'pending_review' || t.status === 'pending_hr_approval' || t.status === 'submitted_to_manager') && isSubthemeInMonth(t, selectedMonth, selectedYear)) ? (
            team.map(member => {
              const pendingForMember = teamThemes.filter(t =>
                (t.employee_id === member.id || t.assigned_to === member.id) &&
                (t.status === 'pending_review' || t.status === 'pending_hr_approval' || t.status === 'submitted_to_manager') &&
                isSubthemeInMonth(t, selectedMonth, selectedYear)
              );

              if (pendingForMember.length === 0) return null;

              return (
                <div key={member.id} className="validation-group" style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div className="emp-avatar" style={{ width: 24, height: 24, fontSize: 9 }}>{getInitials(member)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{member.first_name} {member.last_name}</div>
                  </div>
                  <div className="v-stack" style={{ gap: 12, marginLeft: 12 }}>
                    {Object.entries(
                      pendingForMember.reduce((acc, t) => {
                        const pillarId = t.parent_id || 'unaligned';
                        if (!acc[pillarId]) acc[pillarId] = [];
                        acc[pillarId].push(t);
                        return acc;
                      }, {})
                    ).map(([pillarId, items]) => {
                      const pillar = rootThemes.find(rt => rt.id === pillarId);
                      return (
                        <div key={pillarId} style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', borderLeft: '4px solid var(--cyan)', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--purple)', letterSpacing: 1 }}>THEME</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a' }}>{pillar?.title || "General Contribution"}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                              Category: {pillar?.description?.includes('[') ? pillar.description.split(']')[0].replace('[', '') : 'Strategic Contribution'} • Validation Required
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, opacity: 0.8 }}>
                              {pillar?.description?.includes(']') ? pillar.description.split(']')[1].trim() : pillar?.description}
                            </div>
                          </div>
                          <div className="v-stack" style={{ gap: 10 }}>
                            {items.map(t => (
                              <div key={t.id} style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div className="v-stack" style={{ gap: 4, flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a1a' }}>{t.title}</div>
                                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                                      {t.description?.includes(']') ? t.description.split(']')[1].trim() : t.description}
                                    </div>
                                    <div className="validation-actions" style={{ display: 'flex', gap: 6 }}>
                                      <button className="badge badge-green" style={{ cursor: 'pointer', border: 'none' }} onClick={() => handleThemeAction(t.id, 'approve')}>✓ Approve</button>
                                      <button className="badge badge-yellow" style={{ cursor: 'pointer', border: 'none' }} onClick={() => {
                                        setReturningThemeId(t.id);
                                        setThemeFeedback("");
                                      }}>↩ Return</button>
                                      <button className="badge badge-red" style={{ cursor: 'pointer', border: 'none' }} onClick={() => handleThemeAction(t.id, 'reject')}>✕ Reject</button>
                                    </div>
                                  </div>

                                  {returningThemeId === t.id && (
                                    <div className="v-stack" style={{ gap: 10, marginTop: 12, padding: '16px', background: 'rgba(255,193,7,0.03)', borderRadius: 8, border: '1px solid var(--yellow)' }}>
                                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--yellow)' }}>PROVIDE REVISION GUIDANCE</div>
                                      <textarea 
                                        className="input" 
                                        style={{ height: 60, fontSize: 12 }} 
                                        placeholder="Explain what needs to be changed..."
                                        value={themeFeedback}
                                        onChange={e => setThemeFeedback(e.target.value)}
                                      />
                                      <div className="h-stack" style={{ gap: 10 }}>
                                        <button className="btn-outline" style={{ padding: '4px 12px', fontSize: 10 }} onClick={() => setReturningThemeId(null)}>Cancel</button>
                                        <button 
                                          className="btn-primary" 
                                          style={{ padding: '4px 16px', fontSize: 10, background: 'var(--yellow)', border: 'none' }}
                                          onClick={() => {
                                            if (themeFeedback.trim()) {
                                              handleThemeAction(t.id, 'return', themeFeedback);
                                              setReturningThemeId(null);
                                            } else {
                                              showToast("Please provide guidance", "var(--red)");
                                            }
                                          }}
                                        >
                                          Submit Revert →
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div style={{ height: 1, background: '#f1f5f9', marginTop: 4 }} />
                                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
                                    <span>○</span> Period: {(() => {
                                      if (!t.description?.includes('|')) return '01/04/2026 → 30/04/2026';
                                      const datePart = t.description.split('[')[1].split('|')[0];
                                      const dates = datePart.split(' - ').map(d => d.trim()).filter(Boolean);
                                      if (dates.length < 2) return datePart.replace(/-/g, '→');
                                      return `${formatDate(dates[0])} → ${formatDate(dates[1])}`;
                                    })()}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
                                    <span>○</span> Submitted {(() => {
                                      if (!t.description?.includes('|')) return formatDate(t.submitted_at || t.created_at);
                                      const subDateStr = t.description.split('|')[1].split(']')[0];
                                      return formatDate(subDateStr.trim());
                                    })()}
                                  </div>

                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '20px' }}>○ No pending theme validations.</div>
          )}
          </div>
        )}
      </div>

      <div className="frame" style={{ marginTop: 24 }}>
        <div className="sec-title">Team Monthly Inputs — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>Review employee monthly evidence and align new strategic sub-themes.</div>

        {team.map((m, i) => {
          const review = reviews.filter(r => {
            const isSameYear = r.submitted_at?.startsWith(selectedYear) || r.cycle_id === getCycleIdForYear(selectedYear);
            if (!isSameYear) return false;
            if (r.review_month === selectedMonth) return true;
            if (r.submitted_at) {
              return new Date(r.submitted_at).toLocaleString('en-US', { month: 'short' }).toUpperCase() === selectedMonth;
            }
            if (r.cycle_id === getCycleIdForYear(selectedYear) && selectedMonth === new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase()) return true;
            return false;
          }).sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))[0];
          const themesForUser = teamThemes.filter(t => (t.assigned_to === m.id || t.employee_id === m.id) && isSubthemeInMonth(t, selectedMonth, selectedYear));
          const hasApprovedSubtheme = themesForUser.some(t => t.status === 'approved' && t.parent_id);
          const isAssigning = assigningToMemberId === m.id;

          const hasSubmittedEvidence = review?.rating_status === 'PENDING' || review?.rating_status === 'APPROVED' || review?.rating_status === 'RETURNED';
          return (
            <React.Fragment key={m.id}>
              <div className="member-row" style={{ padding: '16px 24px' }}>
                <div className="member-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="emp-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{getInitials(m)}</div>
                      <div>
                        <div className="member-name">{m.first_name} {m.last_name}</div>
                        <div className="member-role">{m.job_title} · {m.employee_id}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {hasApprovedSubtheme ? (
                        <div className="h-stack" style={{ gap: 8 }}>
                          <div style={{ 
                            padding: '3px 10px', 
                            borderRadius: 4, 
                            background: '#fef2f2', 
                            color: '#ef4444', 
                            fontSize: 9, 
                            fontWeight: 800, 
                            border: '1px solid #fee2e2' 
                          }}>
                            {review?.rating_status?.toUpperCase() === 'APPROVED' ? 'FINALIZED' : 'PENDING'}
                          </div>
                          
                          <button 
                            className="btn-outline" 
                            style={{ 
                              padding: '5px 12px', 
                              fontSize: 10, 
                              color: 'var(--cyan)', 
                              borderColor: 'var(--cyan)',
                              borderRadius: 6,
                              fontWeight: 700,
                              background: 'transparent'
                            }}
                            onClick={() => {
                              console.log("🛠️ Edit Inputs Clicked:", m.id);
                              try {
                                setActivePanel(m.id);
                                const results = review?.theme_results || {};
                                setBinaryInputs({ 
                                  themeResults: (results && typeof results === 'object') ? results : {}, 
                                  comment: review?.manager_comment || ""
                                });
                                if (review?.rating_status?.toUpperCase() === 'RETURNED') {
                                   setSuperiorInput(review?.manager_comment || "");
                                }
                              } catch (err) {
                                console.error("❌ ERROR in Edit Inputs Handler:", err);
                                showToast("UI Error: Failed to open panel", "var(--red)");
                              }
                            }}
                          >
                            Edit Inputs →
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', opacity: 0.6, fontStyle: 'italic' }}>
                            No approved themes
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {activePanel === m.id && (
                <div className="binary-panel">
                  <div className="binary-panel-header">
                    <div className="h-stack" style={{ gap: 12 }}>
                      <div className="emp-avatar">{getInitials(m)}</div>
                      <div className="v-stack">
                        <div className="member-name">{m.first_name} {m.last_name}</div>
                        <div className="member-role">{m.employee_id} · {m.job_title} · April 2026</div>
                      </div>
                    </div>
                    <button className="badge badge-gray" onClick={() => setActivePanel(null)}>✕ Close</button>
                  </div>

                  {/* 1. SUB-THEME RATINGS SECTION */}
                  <div className="v-stack" style={{ gap: 16, marginTop: 24 }}>
                    <div className="sec-title" style={{ fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>RATE SUB-THEMES</div>
                    {themesForUser.filter(t => t.status === 'approved').length > 0 ? (
                      themesForUser.filter(t => t.status === 'approved').map(t => {
                        const isEvidenceApproved = review?.rating_status === 'APPROVED';
                        return (
                          <div key={t.id} className="frame" style={{ background: '#fff', borderLeft: '3px solid var(--purple)', opacity: isEvidenceApproved ? 1 : 0.6, pointerEvents: isEvidenceApproved ? 'auto' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{t.title}</div>
                                <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 700, marginBottom: 4 }}>
                                  ALIGNED TO: {(rootThemes || []).find(rt => String(rt.id) === String(t.parent_id || t.main_theme_id))?.title || "General Pillar"}
                                </div>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>
                                  {(() => {
                                    if (!t.description?.includes('|')) return t.description;
                                    const datePart = t.description.split('[')[1].split('|')[0];
                                    const dates = datePart.split(' - ').map(d => d.trim()).filter(Boolean);
                                    const formattedDates = dates.length < 2 ? datePart.replace(/-/g, '→') : `${formatDate(dates[0])} → ${formatDate(dates[1])}`;
                                    const descText = t.description.includes(']') ? t.description.split(']')[1].trim() : '';
                                    return (
                                      <>
                                        <div style={{ marginBottom: 4, color: 'var(--cyan)' }}>Period: {formattedDates}</div>
                                        <div>{descText}</div>
                                      </>
                                    );
                                  })()}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 800, marginTop: 8 }}>✓ Validation Approved</div>
                              </div>
                              <div className="h-stack" style={{ gap: 8, marginLeft: 24 }}>
                                <button
                                  className={`badge ${binaryInputs.themeResults[t.id] === 'YES' ? 'badge-green' : 'badge-gray'}`}
                                  onClick={() => setBinaryInputs({ ...binaryInputs, themeResults: { ...binaryInputs.themeResults, [t.id]: 'YES' } })}
                                  style={{ height: 32, padding: '0 16px', fontSize: 11 }}
                                  disabled={!isEvidenceApproved}
                                >YES 👍</button>
                                <button
                                  className={`badge ${binaryInputs.themeResults[t.id] === 'NO' ? 'badge-red' : 'badge-gray'}`}
                                  onClick={() => setBinaryInputs({ ...binaryInputs, themeResults: { ...binaryInputs.themeResults, [t.id]: 'NO' } })}
                                  style={{ height: 32, padding: '0 16px', fontSize: 11 }}
                                  disabled={!isEvidenceApproved}
                                >NO 👎</button>
                                <button
                                  className={`badge ${binaryInputs.themeResults[t.id] === 'NEUTRAL' ? 'badge-yellow' : 'badge-gray'}`}
                                  onClick={() => setBinaryInputs({ ...binaryInputs, themeResults: { ...binaryInputs.themeResults, [t.id]: 'NEUTRAL' } })}
                                  style={{ height: 32, padding: '0 16px', fontSize: 11 }}
                                  disabled={!isEvidenceApproved}
                                >NEUTRAL 💡</button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg2)', borderRadius: 10, fontSize: 12, opacity: 0.6 }}>
                        No approved themes to rate. Ensure themes are validated first.
                      </div>
                    )}
                    {review?.rating_status !== 'APPROVED' && themesForUser.filter(t => t.status === 'approved').length > 0 && (
                      <div style={{ textAlign: 'right', fontSize: 10, fontStyle: 'italic', color: 'var(--text3)' }}>
                        Accept evidence below to enable rating buttons
                      </div>
                    )}
                  </div>

                  {/* 2. EVIDENCE REVIEW SECTION */}
                  <div className="frame" style={{ marginTop: 24, background: 'rgba(0,178,236,0.02)', border: '1px solid var(--cyan)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div className="sec-title" style={{ color: 'var(--cyan)', fontSize: 13, margin: 0 }}>EMPLOYEE MONTHLY EVIDENCE</div>
                      <div className="h-stack" style={{ gap: 8 }}>
                        {review?.rating_status?.toUpperCase() === 'APPROVED' ? (
                          <Badge cls="green">Evidence Approved</Badge>
                        ) : review?.rating_status?.toUpperCase() === 'RETURNED' ? (
                           <Badge cls="yellow">Evidence Returned</Badge>
                        ) : review ? (
                          <>
                            <button className="badge badge-green" onClick={async () => {
                              if (!review?.id) return;
                              const { error } = await supabase.from('monthly_reviews').update({ rating_status: 'APPROVED' }).eq('id', review.id);
                              if (!error) { showToast("Evidence Approved", "var(--green)"); fetchManagerData(); }
                            }}>Accept Evidence</button>
                            {returningId === review.id ? (
                               <button className="badge badge-gray" onClick={() => setReturningId(null)}>Cancel Return</button>
                            ) : (
                              <button className="badge badge-yellow" onClick={() => setReturningId(review.id)}>Return to Employee</button>
                            )}
                          </>
                        ) : (
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontStyle: 'italic' }}>○ Awaiting submission</div>
                        )}
                      </div>
                    </div>
                    
                    {review && returningId === review.id && (
                       <div className="frame" style={{ marginBottom: 16, background: 'rgba(255,193,7,0.05)', border: '1px dashed var(--yellow)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--yellow)', marginBottom: 8 }}>SUPERIOR INPUT / GUIDANCE (Required for return)</div>
                          <textarea 
                             className="reflection-box" 
                             placeholder="Provide guidance on what needs to be improved or corrected..."
                             style={{ minHeight: 80, fontSize: 12 }}
                             value={superiorInput}
                             onChange={(e) => setSuperiorInput(e.target.value)}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                             <button className="btn-primary" style={{ background: 'var(--yellow)', height: 32, fontSize: 11 }} onClick={() => handleReturnToEmployee(review.id)}>Send to Re-edit</button>
                          </div>
                       </div>
                    )}
                    <div className="v-stack" style={{ gap: 12 }}>
                      <div className="evidence-group"><div className="evidence-label">ACHIEVEMENTS</div><div className="reflection-body">{review?.emp_achievements || "—"}</div></div>
                      <div className="evidence-group"><div className="evidence-label">BLOCKERS</div><div className="reflection-body">{review?.emp_blockers || "—"}</div></div>
                      <div className="evidence-group"><div className="evidence-label">LEARNING & DEVELOPMENT</div><div className="reflection-body">{review?.emp_learning || "—"}</div></div>
                      <div className="evidence-group"><div className="evidence-label">EVIDENCE & PROOF POINTS</div><div className="reflection-body">{review?.emp_proof_points || "—"}</div></div>
                      <div className="evidence-group">
                        <div className="evidence-label">ATTACHMENTS</div>
                        <div style={{ padding: '12px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
                          {(() => {
                            let rawAtts = review?.attachments || review?.emp_attachments || review?.attachment || review?.emp_attachment;
                            let atts = [];
                            try {
                              atts = typeof rawAtts === 'string' ? JSON.parse(rawAtts) : (rawAtts || []);
                            } catch (e) {
                              console.error("Error parsing attachments:", e);
                              atts = [];
                            }
                            return atts?.length > 0 ? (
                              atts.map((f, idx) => (
                                <a key={idx} href={f.url || f} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--cyan)', display: 'block', marginBottom: 4 }}>📎 {f.name || `File ${idx+1}`}</a>
                              ))
                            ) : <div style={{ fontSize: 11, opacity: 0.5 }}>No attachments found.</div>
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="single-input-row" style={{ marginTop: 24, padding: '20px', background: 'rgba(0,178,236,0.05)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--cyan)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--cyan)' }}>Calculated Monthly Result</div>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>Based on sub-theme ratings above</div>
                    </div>
                    <div>
                      {(() => {
                        const results = binaryInputs.themeResults || {};
                        const vals = typeof results === 'object' ? Object.values(results) : [];
                        const yesCount = vals.filter(v => v === 'YES').length;
                        const noCount = vals.filter(v => v === 'NO').length;
                        const neutralCount = vals.filter(v => v === 'NEUTRAL').length;
                        
                        // --- NEW MAJORITY LOGIC ---
                        // If yesCount > noCount => YES
                        // If noCount > yesCount => NO
                        // If yesCount === noCount => NEUTRAL
                        let overall = 'NEUTRAL';
                        if (yesCount > noCount) {
                          overall = 'YES';
                        } else if (noCount > yesCount) {
                          overall = 'NO';
                        } else {
                          overall = 'NEUTRAL';
                        }

                        if (overall === 'YES') {
                          return <Badge cls="green" style={{ fontSize: 14, padding: '8px 16px' }}>OVERALL: DELIVERED (YES)</Badge>;
                        } else if (overall === 'NO') {
                          return <Badge cls="red" style={{ fontSize: 14, padding: '8px 16px' }}>OVERALL: NOT MET (NO)</Badge>;
                        } else {
                          return <Badge cls="yellow" style={{ fontSize: 14, padding: '8px 16px' }}>OVERALL: NEUTRAL 💡</Badge>;
                        }
                      })()}
                    </div>
                  </div>

                  <div className="frame" style={{ marginTop: 24 }}>
                    <div className="sec-title" style={{ fontSize: 13 }}>Final Manager Feedback</div>
                    <textarea
                      className="reflection-box"
                      placeholder="Enter overall performance feedback..."
                      style={{ minHeight: 100 }}
                      value={binaryInputs.comment}
                      onChange={(e) => setBinaryInputs({ ...binaryInputs, comment: e.target.value })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                      <button className="btn-primary" onClick={() => handleReviewSubmit(m.id)}>Submit Complete Review →</button>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {profile?.role !== 'hod' && profile?.role !== 'md' && (
        <>
          <div className="frame" style={{ marginTop: 24, borderLeft: '4px solid var(--purple)' }}>
            <div className="sec-title" style={{ color: 'var(--purple)' }}>My Proposed Strategy Themes</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 16 }}>Track the status of strategy pillars you have proposed to the HOD.</div>
            <div className="v-stack" style={{ gap: 12 }}>
              {rootThemes.filter(t => t.created_by === activeUser).length > 0 ? (
                rootThemes.filter(t => t.created_by === activeUser).map(t => (
                  <div key={t.id} className="theme-card" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                    <div className="theme-card-header">
                      <div className="theme-card-name">{t.title}</div>
                      <Badge cls={t.status === 'approved' ? 'green' : (t.status === 'rejected' ? 'red' : 'orange')}>
                        {t.status === 'approved' ? 'Approved & Live' : (t.status === 'rejected' ? 'Rejected' : 'Pending HOD')}
                      </Badge>
                    </div>
                    <div className="theme-card-desc" style={{ fontSize: 11 }}>{t.description}</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 11, opacity: 0.5 }}>No themes proposed yet.</div>
              )}
            </div>
          </div>

          <div className="frame" style={{ marginTop: 24, borderLeft: '4px solid var(--purple)' }}>
            <div className="sec-title" style={{ color: 'var(--purple)' }}>Propose New Global Strategy Theme</div>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 16 }}>This theme will be sent to the HOD for approval before becoming active.</div>
            <div className="v-stack" style={{ gap: 12 }}>
              <input 
                className="input" 
                placeholder="Theme Title (e.g. Innovation First)" 
                value={proposedTheme.title} 
                onChange={e => setProposedTheme({ ...proposedTheme, title: e.target.value })} 
              />
              <textarea 
                className="input" 
                style={{ minHeight: 80 }} 
                placeholder="Describe the strategic impact and goals..." 
                value={proposedTheme.description} 
                onChange={e => setProposedTheme({ ...proposedTheme, description: e.target.value })} 
              />
              <button className="btn-primary" style={{ background: 'var(--purple)', border: 'none' }} onClick={handleProposeGlobalTheme}>Send to HOD for Proposal →</button>
            </div>
          </div>
        </>
      )}

      {/* NEW: TEAM ANNUAL VIEW (YTD 2026) */}
      <div className="frame" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'rgba(0,178,236,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="sec-title" style={{ margin: 0 }}>Team Annual View</div>
            <select 
              className="input" 
              style={{ width: 140, height: 32, padding: '0 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)', background: '#fff' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map(y => <option key={y} value={y}>YTD {y}</option>)}
            </select>
          </div>
        </div>
        <div className="report-table-frame" style={{ margin: 0, border: 'none', borderRadius: 0 }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => <th key={m} style={{ textAlign: 'center' }}>{m}</th>)}
                <th>YTD PATTERN</th>
                <th style={{ textAlign: 'center' }}>TREND</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m, i) => {
                const memberReviews = reviews.filter(r => r.employee_id === m.id);
                const monthKeys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

                // Helper to get result for a specific cycle
                const getResult = (monthPrefix) => {
                  const currentMonthShort = new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase();
                  // SORT BY LATEST FIRST so we show the most recent submission for that cycle
                  const sortedReviews = [...memberReviews].sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));
                  
                  const r = sortedReviews.find(rev => {
                    if (rev.cycle_id === getCycleIdForYear(CURRENT_YEAR) && rev.review_month === monthPrefix) return true;
                    if (rev.submitted_at) {
                      const d = new Date(rev.submitted_at);
                      const m = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                      if (m === monthPrefix && d.getFullYear() === CURRENT_YEAR) return true;
                    }
                    return false;
                  });
                  return r ? (r.overall_result || 'NO') : '—';
                };

                const monthlyResults = monthKeys.map(mk => getResult(mk));
                const yesCount = monthlyResults.filter(r => r === 'YES').length;
                const neutralCount = monthlyResults.filter(r => r === 'NEUTRAL').length;
                const totalScored = monthlyResults.filter(r => r !== '—').length;
                
                const scoreRatio = totalScored > 0 ? ((yesCount + (neutralCount * 0.5)) / totalScored) : 0;
                const isStrong = totalScored > 0 && scoreRatio >= 0.7;
                const isNeutralTrend = totalScored > 0 && scoreRatio >= 0.4 && scoreRatio < 0.7;

                const trendLabel = totalScored === 0 ? "No data" : (isStrong ? "↑ Strong" : (isNeutralTrend ? "→ Neutral" : "↓ Needs attention"));
                const trendColor = totalScored === 0 ? 'var(--text3)' : (isStrong ? 'var(--green)' : (isNeutralTrend ? 'var(--yellow)' : 'var(--red)'));
                const barWidth = totalScored === 0 ? '0%' : `${Math.round(scoreRatio * 100)}%`;

                return (
                  <tr key={m.id}>
                    <td>
                      <div className="report-emp-link">
                        <div className="emp-avatar" style={{ width: 24, height: 24, fontSize: 10, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{getInitials(m)}</div>
                        <span>{m.first_name} {m.last_name}</span>
                      </div>
                    </td>
                    {monthlyResults.map((res, idx) => (
                      <td key={idx} style={{ textAlign: 'center' }}>
                        {res === '—' ? '—' : <Badge cls={res === 'YES' ? 'green' : res === 'NO' ? 'red' : 'yellow'}>{res === 'YES' ? 'Y' : 'N'}</Badge>}
                      </td>
                    ))}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: trendColor }}>
                        <span>{trendLabel}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ width: 40, height: 4, background: 'var(--bg3)', borderRadius: 2, margin: '0 auto', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: barWidth, background: trendColor, borderRadius: 2 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── DIRECTOR PORTAL (SATYA L3) ──
function DirectorPortal({ profile, activeUser, showToast }) {
  const [orgStats, setOrgStats] = useState({ yes: 0, no: 0, completion: 0, total: 0 });
  const [deptRates, setDeptRates] = useState([]);
  const [managerRates, setManagerRates] = useState([]);
  const [validationRate, setValidationRate] = useState(0);
  const [governancePillars, setGovernancePillars] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDirectorData();
  }, [activeUser]);

  async function fetchDirectorData() {
    setLoading(true);
    // 1. Fetch ALL data for Organisation Analytics
    const { data: pData } = await supabase.from('profiles').select('*');
    const { data: rData } = await supabase.from('monthly_reviews').select('*'); // Remove .eq('cycle_id') to allow historical heatmap
    const { data: allThemes } = await supabase.from('global_themes').select('*').eq('cycle_id', getCycleIdForYear(CURRENT_YEAR));

    setAllProfiles(pData || []);
    setAllReviews(rData || []);
    const allReviews = rData || []; // For immediate use below
    const allProfiles = pData || []; // For immediate use below

    // 2. Fetch the Managers reporting to this Director (for the legacy branch view if needed)
    const managers = allProfiles?.filter(p => p.manager_id === activeUser) || [];

    // 3. KPI Calculations
    const totalEmps = allProfiles?.length || 0;
    const completedReviews = allReviews?.length || 0;
    const yesReviews = allReviews?.filter(r => r.overall_result === 'YES').length || 0;
    const noReviews = allReviews?.filter(r => r.overall_result === 'NO').length || 0;
    const validatedThemes = allThemes?.filter(t => t.status === 'approved').length || 0;
    const totalThemes = allThemes?.length || 1;

    setOrgStats({
      yes: yesReviews,
      no: noReviews,
      total: totalEmps,
      completion: totalEmps > 0 ? Math.round((completedReviews / totalEmps) * 100) : 0,
      completedCount: completedReviews
    });
    setValidationRate(Math.round((validatedThemes / totalThemes) * 100));

    // 4. Role-based Function/Sub-function Filtering
    let filteredProfiles = allProfiles || [];
    if (profile?.role === 'hod' || profile?.role === 'manager') {
      filteredProfiles = allProfiles?.filter(p => p.function === profile.function) || [];
    }

    const deptMap = {};
    filteredProfiles.forEach(p => {
      const d = p.sub_function || p.function || 'General';
      if (!deptMap[d]) deptMap[d] = { total: 0, completed: 0, yes: 0 };
      deptMap[d].total++;
      
      const userReview = allReviews?.find(r => r.employee_id === p.id);
      if (userReview) {
        deptMap[d].completed++;
        if (userReview.overall_result === 'YES') deptMap[d].yes++;
      }
    });

    setDeptRates(Object.keys(deptMap).map(n => ({
      n, 
      v: Math.round((deptMap[n].yes / Math.max(1, deptMap[n].total)) * 100), 
      c: 'var(--cyan)'
    })));

    // 5. Manager Rates (Filtered by Role context)
    const managerMap = {};
    const managersList = filteredProfiles.filter(p => allProfiles.some(sub => sub.manager_id === p.id)) || [];
    managersList.forEach(m => {
      const team = allProfiles.filter(p => p.manager_id === m.id);
      if (team.length > 0) {
        const yesCount = team.filter(p => allReviews?.some(r => r.employee_id === p.id && r.overall_result === 'YES')).length;
        managerMap[`${m.first_name} ${m.last_name}`] = Math.round((yesCount / team.length) * 100);
      }
    });
    setManagerRates(Object.keys(managerMap).map(n => ({ n, v: managerMap[n], c: 'var(--purple)' })).slice(0, 5));

    // 6. Global Strategy Data (New System)
    const { data: gThemes } = await supabase.from('global_themes').select('*, global_subthemes(*)').eq('cycle_id', getCycleIdForYear(CURRENT_YEAR));
    setGovernancePillars(gThemes || []);

    const { data: allAlignments } = await supabase.from('employee_subtheme_alignment').select('*, global_subthemes(*)');

    const branchData = managers.map(m => {
      const managerAlignments = allAlignments?.filter(a => a.employee_id === m.id) || [];
      return { manager: m, themes: managerAlignments };
    });

    setBranches(branchData);
    setLoading(false);
  }



  return (
    <div className="page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div className="portal-label" style={{ color: 'var(--cyan)' }}>◈ DIRECTORATE ANALYTICS</div>
          <div className="page-title" style={{ color: 'var(--text1)' }}>Organisation <span style={{ color: 'var(--cyan)' }}>Analytics</span></div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>April 2026 · Company-wide performance and trend visibility</div>
        </div>
      </div>

      {/* 1. KPI CARDS - LIGHT MODE */}
      <div className="stats-grid" style={{ marginBottom: 32, gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { l: 'OVERALL YES', v: orgStats.yes, n: `${orgStats.total > 0 ? Math.round((orgStats.yes / orgStats.total) * 100) : 0}% of employees`, c: 'var(--green)' },
          { l: 'OVERALL NO', v: orgStats.no, n: `${orgStats.total > 0 ? Math.round((orgStats.no / orgStats.total) * 100) : 0}% — needs attention`, c: 'var(--red)' },
          { l: 'COMPLETION', v: `${orgStats.completion}%`, n: `↑ ${orgStats.completedCount} of ${orgStats.total} submitted`, c: 'var(--cyan)' },
          { l: 'VALIDATION', v: `${validationRate}%`, n: 'Themes validated', c: 'var(--purple)' }
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ background: '#fff', border: '1px solid var(--frame-border)', padding: '20px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ color: 'var(--text3)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{s.l}</div>
            <div style={{ color: s.c, fontSize: 28, fontWeight: 800, margin: '8px 0' }}>{s.v}</div>
            <div style={{ color: 'var(--text3)', fontSize: 11 }}>{s.n}</div>
          </div>
        ))}
      </div>

      {/* 2. RATE BY SUB-FUNCTION AND MANAGER - LIGHT MODE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="frame" style={{ borderLeft: '4px solid var(--cyan)', background: '#fff' }}>
          <div className="sec-title" style={{ color: 'var(--cyan)', fontSize: 13 }}>YES RATE BY {profile?.role === 'hr' ? 'FUNCTION' : 'SUB-FUNCTION'}</div>
          <div className="v-stack" style={{ gap: 14, marginTop: 16 }}>
            {deptRates.map(d => (
              <div key={d.n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 80, fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{d.n}</div>
                <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3 }}>
                  <div style={{ width: `${d.v}%`, height: '100%', background: d.c, borderRadius: 3 }}></div>
                </div>
                <div style={{ width: 30, fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{d.v}%</div>
              </div>
            ))}
            {deptRates.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>No data available</div>}
          </div>
        </div>
        <div className="frame" style={{ borderLeft: '4px solid var(--purple)', background: '#fff' }}>
          <div className="sec-title" style={{ color: 'var(--purple)', fontSize: 13 }}>YES/NO RATE BY MANAGER</div>
          <div className="v-stack" style={{ gap: 14, marginTop: 16 }}>
            {managerRates.map(d => (
              <div key={d.n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 80, fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>{d.n}</div>
                <div style={{ flex: 1, height: 6, background: 'var(--bg2)', borderRadius: 3 }}>
                  <div style={{ width: `${d.v}%`, height: '100%', background: d.c, borderRadius: 3 }}></div>
                </div>
                <div style={{ width: 30, fontSize: 12, fontWeight: 700, color: 'var(--text1)' }}>{d.v}%</div>
              </div>
            ))}
            {managerRates.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>No data available</div>}
          </div>
        </div>
      </div>

      {/* 3. HEAT MAP - DYNAMIC (12 MONTHS) */}
      <div className="frame" style={{ background: 'rgba(0,178,236,0.01)', border: '1px dashed var(--cyan)' }}>
        <div style={{ color: 'var(--text1)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Performance Heat Map — {profile?.role === 'hr' ? 'Global' : profile?.function} YES Rate</div>
        <div style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 20 }}>Darker teal = higher Yes rate per {profile?.role === 'hr' ? 'function' : 'sub-function'}.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(12, 1fr)', gap: 4 }}>
          <div />
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <div key={m} style={{ textAlign: 'center', fontSize: 9, color: 'var(--text3)', fontWeight: 800 }}>{m}</div>)}
          {deptRates.map(d => {
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const monthlyValues = months.map(month => {
              const reviewsInMonth = allReviews?.filter(r => {
                const isCorrectMonth = r.cycle_id?.startsWith(month) || (r.submitted_at && new Date(r.submitted_at).toLocaleString('en-US', { month: 'short' }).toUpperCase() === month);
                if (!isCorrectMonth) return false;
                
                const empProfile = allProfiles?.find(p => p.id === r.employee_id);
                return (empProfile?.sub_function || empProfile?.function) === d.n;
              }) || [];
              
              if (reviewsInMonth.length === 0) return 0;
              const yesCount = reviewsInMonth.filter(r => r.overall_result === 'YES').length;
              return Math.round((yesCount / reviewsInMonth.length) * 100);
            });

            return (
              <React.Fragment key={d.n}>
                <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600, display: 'flex', alignItems: 'center', lineHeight: 1.1 }}>{d.n}</div>
                {monthlyValues.map((v, i) => (
                  <div key={i} style={{ 
                    background: v === 0 ? 'var(--bg2)' : `rgba(0,178,236, ${v / 150})`, 
                    padding: '8px 0', 
                    borderRadius: 3, 
                    textAlign: 'center', 
                    color: v > 72 ? '#fff' : 'var(--cyan)', 
                    fontSize: 10, 
                    fontWeight: 800, 
                    border: '1px solid rgba(0,178,236,0.1)',
                    opacity: v === 0 ? 0.3 : 1
                  }}>{v}%</div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 4. TREND ANALYSIS - DYNAMIC (12 MONTHS) */}
      <div className="frame" style={{ background: '#fff' }}>
        <div className="sec-title" style={{ fontSize: 15 }}>Annual Performance Trend (12 Months)</div>
        <div style={{ height: 180, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 40px', background: 'var(--bg2)', borderRadius: 8, marginTop: 12 }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 1200 180">
            {deptRates.map((d, dIdx) => {
              const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
              const points = months.map((month, mIdx) => {
                const reviewsInMonth = allReviews?.filter(r => {
                  const isCorrectMonth = r.cycle_id?.startsWith(month) || (r.submitted_at && new Date(r.submitted_at).toLocaleString('en-US', { month: 'short' }).toUpperCase() === month);
                  if (!isCorrectMonth) return false;
                  const empProfile = allProfiles?.find(p => p.id === r.employee_id);
                  return (empProfile?.sub_function || empProfile?.function) === d.n;
                }) || [];
                const yesRate = reviewsInMonth.length > 0 ? (reviewsInMonth.filter(r => r.overall_result === 'YES').length / reviewsInMonth.length) : 0.5;
                const x = (mIdx / (months.length - 1)) * 1200;
                const y = 180 - (yesRate * 150) - 15;
                return `${x},${y}`;
              });
              
              return (
                <path 
                  key={d.n}
                  d={`M ${points.join(' L ')}`} 
                  fill="none" 
                  stroke={AVATAR_COLORS[dIdx % AVATAR_COLORS.length]} 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                />
              );
            })}
          </svg>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => <div key={m} style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>{m}</div>)}
        </div>
      </div>

      {/* 5. EXCEPTIONS - COMPACT MODE (MATCH IMAGE) */}
      <div className="frame" style={{ background: '#fff', padding: '12px 16px' }}>
        <div className="sec-title" style={{ fontSize: 15, borderLeft: '3px solid var(--cyan)', paddingLeft: 12, display: 'flex', alignItems: 'center', height: 24, margin: '0 0 16px 0' }}>Exception Reports</div>
        <table className="hist-table-v3" style={{ marginTop: 0, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ fontSize: 9, color: '#1a1a1a', fontWeight: 800, paddingBottom: 10, textAlign: 'left' }}>EXCEPTION TYPE</th>
              <th style={{ textAlign: 'center', fontSize: 9, color: '#1a1a1a', fontWeight: 800, paddingBottom: 10 }}>COUNT</th>
              <th style={{ fontSize: 9, color: '#1a1a1a', fontWeight: 800, paddingBottom: 10, textAlign: 'left' }}>DEPARTMENT</th>
              <th style={{ fontSize: 9, color: '#1a1a1a', fontWeight: 800, paddingBottom: 10, textAlign: 'left' }}>ACTION REQUIRED</th>
            </tr>
          </thead>
          <tbody>
            {[
              { t: '3+ consecutive No results', c: 8, d: 'Sales, Operations', a: 'Manager review required' },
              { t: 'Missing manager submission', c: 12, d: 'Marketing, Product', a: 'Escalate to department head' },
              { t: 'Theme submission overdue', c: 19, d: 'All departments', a: 'Automated reminder sent' }
            ].map((ex, i) => (
              <tr key={i}>
                <td style={{ fontSize: 11, padding: '6px 0', color: '#334155', textAlign: 'left' }}>{ex.t}</td>
                <td style={{ textAlign: 'center', padding: '6px 0' }}>
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: '#fde8e8', 
                    color: '#c81e1e', 
                    fontSize: 10, 
                    fontWeight: 800,
                    border: '1px solid #f8b4b4'
                  }}>{ex.c}</div>
                </td>
                <td style={{ fontSize: 11, padding: '6px 0', color: '#334155', textAlign: 'left' }}>{ex.d}</td>
                <td style={{ fontSize: 11, padding: '6px 0', color: '#94a3b8', textAlign: 'left' }}>{ex.a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 7. DIRECT MANAGER VALIDATION - NEW SECTION */}
      <div className="frame" style={{ borderLeft: '4px solid var(--orange)', background: '#fff' }}>
        <div className="sec-title" style={{ color: 'var(--orange)', fontSize: 15 }}>Direct Manager Validation</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Validate the strategic alignment and subthemes of managers reporting directly to you.</div>

        <div className="v-stack" style={{ gap: 16 }}>
          {branches.map(b => (
            <div key={b.manager.id} style={{ padding: '16px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--frame-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="emp-avatar" style={{ width: 32, height: 32, fontSize: 10 }}>{getInitials(b.manager)}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{b.manager.first_name} {b.manager.last_name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{b.manager.job_title}</div>
                  </div>
                </div>
                <Badge cls="orange">L2 Manager</Badge>
              </div>

              <div className="v-stack" style={{ gap: 8 }}>
                {b.themes.length > 0 ? (
                  b.themes.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--frame-border)' }}>
                      <div className="v-stack">
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{a.global_subthemes?.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Status: {a.status}</div>
                      </div>
                      <div className="h-stack" style={{ gap: 8 }}>
                        {a.status === 'APPROVED' ? (
                          <Badge cls="green">Validated</Badge>
                        ) : (
                          <>
                            <button className="badge badge-green" style={{ border: 'none', cursor: 'pointer' }} onClick={async () => {
                              const { error } = await supabase.from('employee_subtheme_alignment').update({ status: 'APPROVED' }).eq('id', a.id);
                              if (!error) {
                                showToast("Alignment validated", "var(--green)");
                                fetchDirectorData();
                              }
                            }}>✓ Approve</button>
                            <button className="badge badge-yellow" style={{ border: 'none', cursor: 'pointer' }} onClick={async () => {
                              const { error } = await supabase.from('employee_subtheme_alignment').update({ status: 'REJECTED' }).eq('id', a.id);
                              if (!error) {
                                showToast("Alignment returned", "var(--yellow)");
                                fetchDirectorData();
                              }
                            }}>↩ Return</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', padding: '10px', border: '1px dashed var(--frame-border)', borderRadius: 8 }}>○ No subthemes submitted for validation yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button className="btn-outline">Export Full Report</button>
        <button className="btn-outline">Send Exception Alerts</button>
        <button className="btn-primary" onClick={() => fetchDirectorData()}>Refresh Dashboard</button>
      </div>
    </div>
  );
}

// ── HR DASHBOARD ──
function HRDashboard({ profile, activeUser, showToast }) {
  const [allProfilesCount, setAllProfilesCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [yesOutcomeCount, setYesOutcomeCount] = useState(0);
  const [cycleThemes, setCycleThemes] = useState([]);
  const [managers, setManagers] = useState([]);
  const [proposedTheme, setProposedTheme] = useState({ title: "", description: "" });

  const completionRate = allProfilesCount > 0 ? Math.round((submissionCount / allProfilesCount) * 100) : 0;
  const overallYesRate = submissionCount > 0 ? Math.round((yesOutcomeCount / submissionCount) * 100) : 0;
  const pendingHR = cycleThemes.filter(t => !t.parent_id && t.status === 'pending_hr_approval').length;

  useEffect(() => {
    fetchHRData();
  }, []);

  async function fetchHRData() {
    const { data: mgrs } = await supabase.from('profiles').select('*').eq('role', 'manager');
    setManagers(mgrs || []);
    const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    setAllProfilesCount(empCount || 0);
    const { data: cycleReviews } = await supabase.from('monthly_reviews').select('overall_result, cycle_id');
    const currentYearReviews = cycleReviews?.filter(r => r.cycle_id?.includes(String(CURRENT_YEAR))) || [];
    setSubmissionCount(currentYearReviews.length);
    setYesOutcomeCount(currentYearReviews.filter(r => r.overall_result === 'YES').length);
    const { data: themes } = await supabase.from('global_themes').select('*').eq('cycle_id', getCycleIdForYear(CURRENT_YEAR));
    setCycleThemes(themes || []);
  }

  async function handleHRAction(themeId, action) {
    const { error } = await supabase.from('global_themes').update({ status: action === 'approve' ? 'approved' : 'reverted' }).eq('id', themeId);
    if (!error) {
      showToast(`Action successful`, "var(--green)");
      fetchHRData();
    }
  }

  async function handleProposeGlobalTheme() {
    if (!proposedTheme.title?.trim() || !proposedTheme.description?.trim()) {
      showToast("Please provide both a Title and Description.", "var(--red)");
      return;
    }
    const { error } = await supabase.from('global_themes').insert([{
      ...proposedTheme,
      created_by: activeUser,
      status: profile?.role === 'md' ? 'approved' : 'pending_hod_validation',
      is_active: profile?.role === 'md' ? true : false,
      cycle_id: getCycleIdForYear(CURRENT_YEAR),
      department: profile?.department || null
    }]);
    
    if (!error) {
      showToast("Global theme proposed for HOD approval", "var(--green)");
      setProposedTheme({ title: "", description: "" });
    } else {
      showToast("Error proposing theme", "var(--red)");
    }
  }

  return (
    <div className="page">
      <div className="portal-label">◆ HR DASHBOARD</div>
      <div className="page-title">Organisation <span>Analytics</span></div>
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <StatCard cls="blue" label="ACTIVE EMPLOYEES" val={allProfilesCount} note="Database sync" />
        <StatCard cls="blue" label="COMPLETION" val={`${completionRate}%`} note="Submitted reviews" />
        <StatCard cls="blue" label="YES RATE" val={`${overallYesRate}%`} note="Positive outcomes" />
        <StatCard cls="orange" label="HR PENDING" val={pendingHR} note="Awaiting validation" />
      </div>
      <div className="frame">
        <div className="sec-title">Manager Requests</div>
        {cycleThemes.filter(t => t.status === 'pending_hod_validation' || t.status === 'pending_hr_approval').map(t => (
          <div key={t.id} className="theme-card">
            <div className="theme-card-header">
              <div><div className="theme-card-name">{t.title}</div></div>
              <div className="h-stack" style={{ gap: 12 }}>
                <Badge cls="orange">Pending HOD</Badge>
              </div>
            </div>
            <div className="theme-card-desc">{t.description}</div>
          </div>
        ))}
      </div>

      <div className="frame" style={{ marginTop: 24, borderLeft: '4px solid var(--purple)' }}>
        <div className="sec-title" style={{ color: 'var(--purple)' }}>Strategy Proposal History</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 16 }}>Full record of strategy proposals and their validation status.</div>
        <div className="v-stack" style={{ gap: 12 }}>
          {cycleThemes.filter(t => t.created_by === activeUser || t.status !== 'approved').length > 0 ? (
            cycleThemes.filter(t => t.created_by === activeUser || t.status !== 'approved').map(t => (
              <div key={t.id} className="theme-card" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div className="theme-card-header">
                  <div className="theme-card-name">{t.title}</div>
                  <Badge cls={t.status === 'approved' ? 'green' : (t.status === 'rejected' ? 'red' : 'orange')}>
                    {t.status === 'approved' ? 'Approved & Live' : (t.status === 'rejected' ? 'Rejected' : 'Pending HOD')}
                  </Badge>
                </div>
                <div className="theme-card-desc" style={{ fontSize: 11 }}>{t.description}</div>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 11, opacity: 0.5 }}>No strategy proposals found.</div>
          )}
        </div>
      </div>

      <div className="frame" style={{ marginTop: 24, borderLeft: '4px solid var(--purple)' }}>
        <div className="sec-title" style={{ color: 'var(--purple)' }}>Propose New Global Strategy Theme</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 16 }}>As HR, you can propose new strategic pillars. These will go to the HOD for final validation.</div>
        <div className="v-stack" style={{ gap: 12 }}>
          <input 
            className="input" 
            placeholder="Theme Title (e.g. Talent Growth)" 
            value={proposedTheme.title} 
            onChange={e => setProposedTheme({ ...proposedTheme, title: e.target.value })} 
          />
          <textarea 
            className="input" 
            style={{ minHeight: 80 }} 
            placeholder="Describe the strategic impact and goals..." 
            value={proposedTheme.description} 
            onChange={e => setProposedTheme({ ...proposedTheme, description: e.target.value })} 
          />
          <button className="btn-primary" style={{ background: 'var(--purple)', border: 'none' }} onClick={handleProposeGlobalTheme}>Propose Global Strategy →</button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APPLICATION ──
export default function App() {
  const [page, setPage] = useState("employee");
  const [profile, setProfile] = useState(null);
  const [editingSubthemeId, setEditingSubthemeId] = useState(null);
  const [toast, setToast] = useState({ show: false, msg: "", color: "" });
  const navigate = useNavigate();
  const timerRef = useRef();

  useEffect(() => {
    async function initSession() {
      const { data: { user } } = await supabase.auth.getUser();
      // Fetch cycles globally
      const { data: cycles } = await supabase.from('master_cycles').select('*');
      ALL_CYCLES = cycles || [];
      ACTIVE_CYCLE = cycles?.find(c => c.is_active) || null;

      if (!user) {
        // Fallback for development/testing if no auth user
        // In production, navigate("/") would be active
        console.log("No auth user found, waiting for login...");
      } else {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`auth_email.eq.${user.email},employee_id.eq.${user.user_metadata?.employee_id || ''}`)
          .single();
        
        if (profileData) {
          setProfile(profileData);
          // NEW: Default page routing based on role
          if (profileData.role === 'hod' || profileData.role === 'hr') {
            setPage("overview");
          } else if (profileData.role === 'manager') {
            setPage("manager");
          } else {
            setPage("employee");
          }
        } else {
          console.error("Profile not found for user:", user.email);
        }
      }
    }
    initSession();
  }, [navigate]);

  function showToast(msg, color) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ show: true, msg, color });
    timerRef.current = setTimeout(() => setToast({ show: false, msg: "", color: "" }), 3000);
  }

  const TABS = [
    profile?.role === 'hod' || profile?.role === 'hr' || profile?.role === 'md' ? ["overview", "○ Overview"] : null,
    ["employee", "○ My Reviews"],
    profile?.role === 'manager' || profile?.role === 'hod' || profile?.role === 'hr' || profile?.role === 'md' ? ["manager", "◈ Manager"] : null,
    profile?.role === 'hr' ? ["hr", "◈ Dashboard"] : (profile?.role === 'hod' || profile?.role === 'manager' || profile?.role === 'md' ? ["director", "◈ Dashboard"] : null),
    ["reports", "◈ Reports"],
    profile?.role === 'hr' || profile?.role === 'md' ? ["upload", "◈ Data Management"] : null,
    profile?.role === 'hr' || profile?.role === 'hod' || profile?.role === 'md' ? ["architecture", "◈ Architecture"] : null,
    profile?.role === 'hod' || profile?.role === 'md' ? ["strategy", "◈ Strategic Themes"] : null
  ].filter(Boolean);

  return (
    <div className="pr-wrap">
      <nav className="nav">
        <div className="nav-logo"><span>PulseReview</span></div>
        <div className="nav-tabs">
          {TABS.map(([id, label]) => (
            <button key={id} className={`nav-tab ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>{label}</button>
          ))}
        </div>
        <div className="nav-right">
          <div className="nav-user">
            <div className="v-stack" style={{ alignItems: 'flex-end', marginRight: 12 }}>
              <span style={{ fontWeight: 700, color: 'var(--text1)' }}>{profile?.first_name} {profile?.last_name}</span>
              <div className="h-stack" style={{ gap: 6, fontSize: 10 }}>
                <span style={{ color: 'var(--text2)', fontWeight: 600 }}>{profile?.function || 'General'}</span>
                {profile?.sub_function && <span>· {profile.sub_function}</span>}
              </div>
            </div>
            <div className="avatar" style={{ background: 'var(--purple)', color: '#fff' }}>{getInitials(profile)}</div>
          </div>
          <button className="badge badge-red" style={{ marginLeft: 12 }} onClick={() => supabase.auth.signOut().then(() => navigate("/"))}>Logout</button>
        </div>
      </nav>
      {page === "overview" && <OverviewPage profile={profile} />}
      {page === "employee" && <Employee profile={profile} activeUser={profile?.id} showToast={showToast} />}
      {page === "manager" && <ManagerPortal profile={profile} activeUser={profile?.id} showToast={showToast} />}
      {page === "director" && <DirectorPortal profile={profile} activeUser={profile?.id} showToast={showToast} />}
      {page === "hr" && <HRDashboard profile={profile} activeUser={profile?.id} showToast={showToast} />}
      {page === "reports" && <Reports profile={profile} activeUser={profile?.id} showToast={showToast} />}
      {page === "upload" && <DataManagement profile={profile} showToast={showToast} />}
      {page === "architecture" && <ArchitecturePage profile={profile} />}
      {page === "strategy" && <HODPortal profile={profile} showToast={showToast} />}
      <Toast {...toast} />
      <DevImpersonator setProfile={setProfile} setPage={setPage} showToast={showToast} />
      <VoiceAssistant profile={profile} activeUser={profile?.id} setProfile={setProfile} setPage={setPage} showToast={showToast} />
    </div>
  );
}

// ── NEW: DEV IMPERSONATOR (FOR TESTING HIERARCHY) ──
function DevImpersonator({ setProfile, setPage, showToast }) {
  const [profiles, setProfiles] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      const { data } = await supabase.from('profiles').select('*').order('employee_id');
      setProfiles(data || []);
    }
    fetchAll();
  }, []);

  if (process.env.NODE_ENV === 'production' && !window.location.hostname.includes('localhost')) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'var(--purple)', color: '#fff', border: 'none', borderRadius: '50%', width: 50, height: 50, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', fontSize: 20 }}
        title="Impersonate User (Dev Tool)"
      >
        👤
      </button>
      {isOpen && (
        <div className="frame" style={{ position: 'absolute', bottom: 60, right: 0, width: 300, maxHeight: 400, overflowY: 'auto', background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', padding: 16 }}>
          <div className="sec-title" style={{ fontSize: 13, marginBottom: 12 }}>Test Hierarchy Roles</div>
          <div className="v-stack" style={{ gap: 8 }}>
            {profiles.map(p => (
              <button 
                key={p.id}
                className="btn-outline"
                style={{ textAlign: 'left', fontSize: 11, padding: '8px 12px', justifyContent: 'flex-start', display: 'flex', gap: 8 }}
                onClick={() => {
                  setProfile(p);
                  if (p.role === 'hod' || p.role === 'hr') {
                    setPage("overview");
                  } else if (p.role === 'manager') {
                    setPage("manager");
                  } else {
                    setPage("employee");
                  }
                  setIsOpen(false);
                  showToast(`Now acting as ${p.first_name} (${p.role.toUpperCase()})`, "var(--purple)");
                }}
              >
                <Badge cls={p.role === 'hod' ? 'purple' : p.role === 'manager' ? 'orange' : 'blue'}>{p.role.charAt(0).toUpperCase()}</Badge>
                <div className="v-stack">
                  <span style={{ fontWeight: 700 }}>{p.first_name} {p.last_name}</span>
                  <span style={{ opacity: 0.6 }}>{p.job_title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NEW: DATA MANAGEMENT COMPONENT ──
function DataManagement({ profile, showToast }) {
  const [uploading, setUploading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExportData();
  }, []);

  async function fetchExportData() {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      setReportData(profiles || []);
      
      const { data: reviews } = await supabase.from('monthly_reviews').select('*');
      setAllReviews(reviews || []);
    } catch (err) {
      console.error("Export fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    showToast("Processing Excel file...", "var(--purple)");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        for (const row of data) {
           await supabase.from('profiles').upsert({
             employee_id: row.EmployeeID,
             first_name: row.FirstName,
             last_name: row.LastName,
             job_title: row.JobTitle,
             department: row.Department,
             role: row.Role?.toLowerCase() || 'employee',
             employment_type: row.EmploymentType || 'PERMANENT',
             function: row.Function,
             sub_function: row.SubFunction,
             auth_email: (row.Email || row.AuthEmail || row.auth_email) ? String(row.Email || row.AuthEmail || row.auth_email).trim().toLowerCase() : null,
             manager_id: (row.ManagerID || row.ManagerId || row.manager_id) ? String(row.ManagerID || row.ManagerId || row.manager_id).trim() : null
           }, { onConflict: 'employee_id' });
        }
        showToast("Data uploaded successfully!", "var(--green)");
        fetchExportData(); // Refresh list after upload
      } catch (err) {
        showToast("Error parsing Excel", "var(--red)");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  }

  async function handleHistoricalUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    showToast("Processing Historical Data...", "var(--purple)");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // 1. Get all profiles to map EmployeeID to internal UUID
        const { data: profiles } = await supabase.from('profiles').select('id, employee_id');
        const profileMap = {};
        profiles.forEach(p => profileMap[p.employee_id] = p.id);
        let successCount = 0;
        for (const row of data) {
           const internalId = profileMap[row.EmployeeID];
           if (!internalId) {
             console.warn(`Skipping: EmployeeID ${row.EmployeeID} not found in database.`);
             continue;
           }

           const result = String(row.Result || row.Outcome || "").toUpperCase();
           const finalResult = (result.includes("UP") || result === "YES" || result === "Y") ? "YES" : "NO";
           const cycleId = getCycleIdForYear(row.Year || '2025');
           const reviewMonth = String(row.Month || 'UNKNOWN').toUpperCase();

           await supabase.from('monthly_reviews').upsert({
             employee_id: internalId,
             cycle_id: cycleId,
             review_month: reviewMonth,
             overall_result: finalResult,
             rating_status: 'APPROVED',
             submitted_at: new Date().toISOString()
           }, { onConflict: 'employee_id,review_month,cycle_id' });
           successCount++;
        }
        showToast(`Imported ${successCount} historical records`, "var(--green)");
        fetchExportData();
      } catch (err) {
        showToast("Error parsing historical Excel", "var(--red)");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  }

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      <div className="portal-label">◈ MASTER DATA & IMPORTS</div>
      <div className="page-title">Admin <span>Console</span></div>
      
      <div className="v-stack" style={{ gap: 32 }}>
        <div className="frame">
          <div className="sec-title">1. Bulk Organization Import</div>
          <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>Upload an Excel file to sync SAP Connect Employee Data. Requires columns: EmployeeID, FirstName, LastName, JobTitle, Department, Role.</p>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={uploading} className="input" />
        </div>

        <div className="frame" style={{ borderLeft: '4px solid var(--purple)' }}>
          <div className="sec-title" style={{ color: 'var(--purple)' }}>2. Historical Review Sync</div>
          <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>Upload historical Yes/No reviews to populate rolling averages. Requires columns: EmployeeID, Year, Month, Result.</p>
          <input type="file" accept=".xlsx, .xls" onChange={handleHistoricalUpload} disabled={uploading} className="input" />
        </div>
      </div>
    </div>
  );
}

// ── NEW: HOD STRATEGY GOVERNANCE PORTAL ──
function HODPortal({ profile, showToast }) {
  const [themes, setThemes] = useState([]);
  const [newTheme, setNewTheme] = useState({ title: "", description: "" });
  const [newSubtheme, setNewSubtheme] = useState({ theme_id: "", title: "", description: "" });
  const [pendingAlignments, setPendingAlignments] = useState([]);

  useEffect(() => {
    fetchThemes();
  }, []);

  async function fetchThemes() {
    const { data } = await supabase.from('global_themes').select('*, global_subthemes(*)').order('created_at', { ascending: false });
    setThemes(data || []);

    const { data: alignments } = await supabase
      .from('employee_subtheme_alignment')
      .select('*, global_subthemes(*, global_themes(*)), profiles(*)')
      .eq('status', 'PENDING_HOD_VALIDATION');
    setPendingAlignments(alignments || []);
  }

  async function validateTheme(themeId, action) {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase.from('global_themes').update({ status }).eq('id', themeId);
    if (!error) { 
      showToast(action === 'approve' ? "Theme activated and broadcasted" : "Theme rejected", action === 'approve' ? "var(--green)" : "var(--red)");
      fetchThemes(); 
    }
  }

  async function createTheme() {
    if (!newTheme.title?.trim() || !newTheme.description?.trim()) {
      showToast("Please provide both a Title and Description.", "var(--red)");
      return;
    }
    const { error } = await supabase.from('global_themes').insert([{
      title: newTheme.title,
      description: newTheme.description,
      status: 'approved',
      created_by: profile.id,
      cycle_id: getCycleIdForYear(CURRENT_YEAR),
      department: profile?.department || null
    }]);
    if (!error) { 
      showToast("Theme published successfully", "var(--green)"); 
      setNewTheme({ title: "", description: "" }); 
      fetchThemes(); 
    }
  }

  async function createSubtheme() {
    if (!newSubtheme.theme_id || !newSubtheme.title?.trim() || !newSubtheme.description?.trim()) {
      showToast("Please select a Parent Theme and provide both Title and Description.", "var(--red)");
      return;
    }
    const { error } = await supabase.from('global_subthemes').insert([newSubtheme]);
    if (!error) { showToast("Subtheme added", "var(--green)"); setNewSubtheme({ theme_id: "", title: "", description: "" }); fetchThemes(); }
  }

  return (
    <div className="page" style={{ paddingBottom: 60 }}>
      <div className="portal-label">◆ STRATEGY GOVERNANCE</div>
      <div className="page-title">Approval <span>& Management</span></div>
      
      <div className="v-stack" style={{ gap: 32 }}>
        {/* PROPOSAL QUEUE - FULL WIDTH */}
        <div className="frame" style={{ borderLeft: '4px solid var(--purple)', background: 'rgba(103,58,183,0.01)' }}>
          <div className="sec-title" style={{ color: 'var(--purple)' }}>| Strategy Proposal Queue</div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 16 }}>Review and validate incoming strategic themes and sub-themes.</div>
          <div className="v-stack" style={{ gap: 12 }}>
            {themes.filter(t => t.status === 'pending_hod_validation').length > 0 && (
              <div className="v-stack" style={{ gap: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--purple)', letterSpacing: 0.5, marginBottom: 4 }}>STRATEGIC THEME PROPOSALS</div>
                {themes.filter(t => t.status === 'pending_hod_validation').map(t => (
                  <div key={t.id} className="validation-card" style={{ padding: '20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div className="h-stack" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="v-stack" style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a' }}>{t.title}</div>
                        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6, marginBottom: 16 }}>{t.description}</div>
                      </div>
                      <div className="h-stack" style={{ gap: 12, marginLeft: 20 }}>
                        <button className="badge badge-green" style={{ cursor: 'pointer', padding: '10px 20px', border: 'none', fontWeight: 800, fontSize: 12 }} onClick={() => validateTheme(t.id, 'approve')}>✓ Accept & Go Live</button>
                        <button className="badge badge-red" style={{ cursor: 'pointer', padding: '10px 20px', border: 'none', fontWeight: 800, fontSize: 12 }} onClick={() => validateTheme(t.id, 'reject')}>✕ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingAlignments.length > 0 && (
              <div className="v-stack" style={{ gap: 12, marginTop: themes.filter(t => t.status === 'pending_hod_validation').length > 0 ? 24 : 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--cyan)', letterSpacing: 0.5, marginBottom: 4 }}>SUB-THEME PROPOSALS</div>
                {pendingAlignments.map(a => (
                  <div key={a.id} className="validation-card" style={{ padding: '20px', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div className="h-stack" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="v-stack" style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a1a' }}>{a.global_subthemes?.title}</div>
                        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6, marginBottom: 12 }}>
                          {a.global_subthemes?.description?.includes(']') ? a.global_subthemes.description.split(']')[1].trim() : a.global_subthemes?.description}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          <strong>Parent Pillar:</strong> {a.global_subthemes?.global_themes?.title || 'Unknown'} <br />
                          <strong>Proposed By:</strong> {a.profiles?.first_name} {a.profiles?.last_name} ({a.profiles?.department || 'N/A'})
                        </div>
                      </div>
                      <div className="h-stack" style={{ gap: 12, marginLeft: 20 }}>
                        <button 
                          className="badge badge-green" 
                          style={{ cursor: 'pointer', padding: '10px 20px', border: 'none', fontWeight: 800, fontSize: 12 }} 
                          onClick={async () => {
                            const { error } = await supabase.from('employee_subtheme_alignment').update({ status: 'APPROVED' }).eq('id', a.id);
                            if (!error) {
                              showToast("Sub-theme alignment approved!", "var(--green)");
                              fetchThemes();
                            }
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="badge badge-red" 
                          style={{ cursor: 'pointer', padding: '10px 20px', border: 'none', fontWeight: 800, fontSize: 12 }} 
                          onClick={async () => {
                            const { error } = await supabase.from('employee_subtheme_alignment').update({ status: 'REJECTED' }).eq('id', a.id);
                            if (!error) {
                              showToast("Sub-theme alignment returned to employee!", "var(--red)");
                              fetchThemes();
                            }
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {themes.filter(t => t.status === 'pending_hod_validation').length === 0 && pendingAlignments.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg2)', borderRadius: 12, border: '1px dashed var(--border)', fontSize: 13, opacity: 0.6 }}>
                ○ No pending strategy or sub-theme proposals currently.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sec-title" style={{ marginTop: 40, marginBottom: 16 }}>| Current Active Strategies</div>
      <div className="v-stack" style={{ gap: 20 }}>
        {themes.filter(t => t.status === 'approved').length > 0 ? (
          themes.filter(t => t.status === 'approved').map(t => (
            <div key={t.id} className="frame" style={{ borderTop: '2px solid var(--cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="v-stack">
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text1)' }}>{t.title}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{t.description}</div>
                </div>
                <Badge cls="green">ACTIVE & LIVE</Badge>
              </div>
              
              <div className="v-stack" style={{ gap: 10, paddingLeft: 20, borderLeft: '2px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>Execution Items (Subthemes)</div>
                {t.global_subthemes?.map(st => (
                  <div key={st.id} style={{ fontSize: 12, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <strong>{st.title}</strong>: {st.description}
                  </div>
                ))}
                <div className="h-stack" style={{ gap: 10, marginTop: 10 }}>
                  <input className="input" style={{ flex: 1, height: 36, fontSize: 12 }} placeholder="New Execution Item..." value={newSubtheme.theme_id === t.id ? newSubtheme.title : ""} onChange={e => setNewSubtheme({ ...newSubtheme, theme_id: t.id, title: e.target.value })} />
                  <button className="btn-outline" style={{ height: 36, padding: '0 16px', fontSize: 12 }} onClick={() => createSubtheme()}>+ Add Item</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="frame" style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No active strategies found.</div>
        )}
      </div>
    </div>
  );
}

// ── REPORTS PORTAL ──
function Reports({ profile, activeUser, showToast }) {
  const [reportData, setReportData] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allThemes, setAllThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase());

  useEffect(() => {
    fetchReports();
  }, [activeUser, profile, selectedYear, selectedMonth]);

  async function fetchReports() {
    setLoading(true);
    const { data: profiles } = await supabase.from('profiles').select('*');
    
    // Fetch all reviews for the organization to allow historical lookup
    const { data: reviews } = await supabase.from('monthly_reviews').select('*');
    const { data: themes } = await supabase.from('global_themes').select('*').eq('status', 'approved').eq('cycle_id', getCycleIdForYear(selectedYear));

    setAllProfiles(profiles || []);
    setAllReviews(reviews || []);
    setAllThemes(themes || []);

    let targetProfiles = [];
    const role = profile?.role?.toLowerCase();

    if (role === 'hr') {
      // HR sees everyone
      targetProfiles = profiles || [];
    } else if (role === 'hod') {
      // HOD sees FULL hierarchy (Direct + Indirect)
      try {
        const { data: hierarchy, error } = await supabase.rpc('get_reports_hierarchy', { manager_uuid: activeUser });
        if (error) throw error;
        const reportIds = new Set(hierarchy?.map(h => h.profile_id) || []);
        targetProfiles = profiles?.filter(p => reportIds.has(p.id) || p.id === activeUser) || [];
      } catch (err) {
        targetProfiles = profiles?.filter(p => p.manager_id === activeUser || p.id === activeUser) || [];
      }
    } else if (role === 'manager') {
      // Manager sees only Direct Reports
      targetProfiles = profiles?.filter(p => p.manager_id === activeUser || p.id === activeUser) || [];
    } else {
      // Regular employee: Only see self
      targetProfiles = profiles?.filter(p => p.id === activeUser) || [];
    }

    setReportData(targetProfiles);
    setLoading(false);
  }

  function getPerformanceDetail(personId) {
    const person = allProfiles.find(p => p.id === personId);
    // Filter reviews by Year and Person
    const personReviews = allReviews.filter(r => r.employee_id === personId && (r.submitted_at?.startsWith(selectedYear) || r.cycle_id === getCycleIdForYear(selectedYear)));
    const latestReview = personReviews.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];

    if (!person) return null;

    return (
      <div className="frame" style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--cyan)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div className="h-stack" style={{ gap: 12 }}>
            <div className="emp-avatar" style={{ width: 40, height: 40 }}>{getInitials(person)}</div>
            <div className="v-stack">
              <div style={{ fontSize: 16, fontWeight: 800 }}>{person.first_name} {person.last_name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{person.job_title}</div>
            </div>
          </div>
          <Badge cls={latestReview?.overall_result === 'YES' ? 'green' : latestReview?.overall_result === 'NO' ? 'red' : latestReview?.overall_result === 'NEUTRAL' ? 'gray' : 'yellow'}>
            {latestReview?.overall_result || 'N/A'}
          </Badge>
        </div>

        <div className="v-stack" style={{ gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text3)' }}>{selectedYear} PERFORMANCE TRACKER</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => {
              const mIndex = (i + 1).toString().padStart(2, '0');
              const mReview = personReviews.find(r => r.submitted_at?.includes(`-${mIndex}-`) || r.cycle_id?.includes(`${selectedYear}-${mIndex}`));
              return (
                <div key={m} style={{ padding: '6px', textAlign: 'center', background: '#fff', borderRadius: 4, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 9, opacity: 0.5 }}>{m}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: mReview?.overall_result === 'YES' ? 'var(--green)' : mReview?.overall_result === 'NO' ? 'var(--red)' : 'var(--text3)' }}>
                    {mReview?.overall_result || '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="v-stack" style={{ gap: 12 }}>
          <div className="evidence-group">
            <div className="evidence-label" style={{ fontSize: 10 }}>ACHIEVEMENTS</div>
            <div className="reflection-body" style={{ background: '#fff', padding: 10, borderRadius: 8, fontSize: 11 }}>{latestReview?.emp_achievements || "—"}</div>
          </div>
          <div className="evidence-group">
            <div className="evidence-label" style={{ fontSize: 10 }}>BLOCKERS</div>
            <div className="reflection-body" style={{ background: '#fff', padding: 10, borderRadius: 8, fontSize: 11 }}>{latestReview?.emp_blockers || "—"}</div>
          </div>
          <div className="evidence-group">
            <div className="evidence-label" style={{ fontSize: 10 }}>LEARNING & DEVELOPMENT</div>
            <div className="reflection-body" style={{ background: '#fff', padding: 10, borderRadius: 8, fontSize: 11 }}>{latestReview?.emp_learning || "—"}</div>
          </div>
          <div className="evidence-group">
            <div className="evidence-label" style={{ fontSize: 10 }}>EVIDENCE & PROOF POINTS</div>
            <div className="reflection-body" style={{ background: '#fff', padding: 10, borderRadius: 8, fontSize: 11 }}>{latestReview?.emp_proof_points || "—"}</div>
          </div>
          <div className="evidence-group">
            <div className="evidence-label" style={{ fontSize: 10 }}>ATTACHMENTS</div>
            <div style={{ padding: '10px', background: '#fff', borderRadius: 8, border: '1px solid var(--border)' }}>
              {(() => {
                let rawAtts = latestReview?.attachments || latestReview?.emp_attachments || latestReview?.attachment || latestReview?.emp_attachment;
                let atts = [];
                try {
                  atts = typeof rawAtts === 'string' ? JSON.parse(rawAtts) : (rawAtts || []);
                } catch (e) {
                  console.error("Error parsing attachments:", e);
                  atts = [];
                }
                return atts?.length > 0 ? (
                  atts.map((f, idx) => (
                    <a key={idx} href={f.url || f} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--cyan)', display: 'block', marginBottom: 4 }}>📎 {f.name || `File ${idx+1}`}</a>
                  ))
                ) : <div style={{ fontSize: 11, opacity: 0.5 }}>No attachments found.</div>
              })()}
            </div>
          </div>
          <div className="evidence-group">
            <div className="evidence-label" style={{ fontSize: 10 }}>LATEST MANAGER FEEDBACK</div>
            <div className="reflection-body" style={{ background: 'rgba(0,178,236,0.05)', padding: 10, borderRadius: 8, fontSize: 11 }}>{latestReview?.manager_comment || "No feedback recorded."}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      <div className="portal-label">◈ GOVERNANCE REPORTING</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">Monthly <span>Performance Reports</span></div>
        <div className="h-stack" style={{ gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>SELECT MONTH:</div>
          <select 
            className="input" 
            style={{ width: 100, height: 36 }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div style={{ fontSize: 12, fontWeight: 700, marginLeft: 12 }}>SELECT YEAR:</div>
          <select 
            className="input" 
            style={{ width: 100, height: 36 }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: selectedPersonId ? '1fr 350px' : '1fr', gap: 24 }}>
        <div className="v-stack" style={{ gap: 20 }}>
          <div className="report-table-frame">
            <table className="report-table">
              <thead><tr><th>Employee</th><th>Outcome</th></tr></thead>
              <tbody>
                {reportData.map(d => {
                  const review = allReviews.filter(r => {
                    if (r.employee_id !== d.id) return false;
                    
                    const isSameYear = r.submitted_at?.startsWith(selectedYear) || r.cycle_id === getCycleIdForYear(selectedYear);
                    if (!isSameYear) return false;
                    
                    // Match month
                    if (r.review_month === selectedMonth) return true;
                    if (r.submitted_at) {
                      const dateObj = new Date(r.submitted_at);
                      return dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() === selectedMonth;
                    }
                    return false;
                  }).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
                  
                  const outcome = review?.overall_result || 'PENDING';
                  const badgeCls = outcome === 'YES' ? 'green' : (outcome === 'NO' ? 'red' : (outcome === 'NEUTRAL' ? 'yellow' : 'gray'));
                  
                  return (
                    <tr key={d.id} onClick={() => { setSelectedPersonId(d.id); setSelectedManagerId(d.id); }} style={{ cursor: 'pointer', background: selectedPersonId === d.id ? 'var(--bg2)' : '' }}>
                      <td style={{ fontWeight: 600, color: 'var(--cyan)' }}>{d.first_name} {d.last_name}</td>
                      <td><Badge cls={badgeCls}>{outcome}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selectedManagerId && (
            <div className="frame">
              <div className="sec-title" style={{ fontSize: 13 }}>Team reporting to {allProfiles.find(p => p.id === selectedManagerId)?.first_name}</div>
              <table className="report-table">
                <tbody>
                  {allProfiles.filter(p => p.manager_id === selectedManagerId).map(m => {
                    const review = allReviews.filter(r => {
                      if (r.employee_id !== m.id) return false;
                      const isSameYear = r.submitted_at?.startsWith(selectedYear) || r.cycle_id === getCycleIdForYear(selectedYear);
                      if (!isSameYear) return false;
                      
                      // Match month
                      if (r.review_month === selectedMonth) return true;
                      if (r.submitted_at) {
                        const dateObj = new Date(r.submitted_at);
                        return dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() === selectedMonth;
                      }
                      return false;
                    }).sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
                    
                    const outcome = review?.overall_result || 'PENDING';
                    const badgeCls = outcome === 'YES' ? 'green' : (outcome === 'NO' ? 'red' : (outcome === 'NEUTRAL' ? 'yellow' : 'gray'));
                    
                    return (
                      <tr key={m.id} onClick={() => setSelectedPersonId(m.id)} style={{ cursor: 'pointer', background: selectedPersonId === m.id ? 'var(--bg2)' : '' }}>
                        <td>{m.first_name} {m.last_name}</td>
                        <td><Badge cls={badgeCls}>{outcome}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {selectedPersonId && <div className="sticky-detail">{getPerformanceDetail(selectedPersonId)}</div>}
      </div>
    </div>
  );
}

// ── OVERVIEW PORTAL ──
function OverviewPage({ profile }) {
  const [allProfilesCount, setAllProfilesCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [yesOutcomeCount, setYesOutcomeCount] = useState(0);
  const [cycleThemes, setCycleThemes] = useState([]);
  const [deptDistribution, setDeptDistribution] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase());
  const [trendPoints, setTrendPoints] = useState([]);

  const [pendingValidationsCount, setPendingValidationsCount] = useState(0);

  const completionRate = allProfilesCount > 0 ? Math.round((submissionCount / allProfilesCount) * 100) : 0;
  const overallYesRate = submissionCount > 0 ? Math.round((yesOutcomeCount / submissionCount) * 100) : 0;
  const pendingGeneral = pendingValidationsCount;
  const alertCount = pendingValidationsCount > 0 ? 3 : 2;

  useEffect(() => {
    fetchLiveMetrics();
  }, [selectedYear, selectedMonth]);

  async function fetchLiveMetrics() {
    // 1. Total employees & departments
    const { data: allProfiles } = await supabase.from('profiles').select('id, department');
    setAllProfilesCount(allProfiles?.length || 0);

    // 2. Reviews for cycle (Match month/year)
    const { data: allRevs } = await supabase.from('monthly_reviews').select('overall_result, employee_id, cycle_id, submitted_at');
    const cycleReviews = allRevs?.filter(r => {
       const isSameYear = r.submitted_at?.startsWith(selectedYear) || r.cycle_id === getCycleIdForYear(selectedYear);
       if (!isSameYear) return false;
       if (r.review_month === selectedMonth) return true;
       if (r.submitted_at) {
         return new Date(r.submitted_at).toLocaleString('en-US', { month: 'short' }).toUpperCase() === selectedMonth;
       }
       return false;
    }) || [];

    setSubmissionCount(cycleReviews.length);
    setYesOutcomeCount(cycleReviews.filter(r => r.overall_result === 'YES').length);

    // 3. Themes for cycle
    const { data: themes } = await supabase.from('global_themes').select('*');
    const filteredThemes = themes?.filter(t => t.cycle_id === selectedYear || t.created_at?.startsWith(selectedYear)) || [];
    setCycleThemes(filteredThemes);

    // Fetch and count pending alignments dynamically
    const { data: alignments } = await supabase.from('employee_subtheme_alignment').select('*, global_subthemes(*)');
    const pendingAlignmentsCount = alignments?.filter(a => {
      const isPending = ['PENDING', 'PENDING_HR_VALIDATION', 'PENDING_HOD_VALIDATION', 'PENDING_MD_VALIDATION'].includes(a.status);
      if (!isPending) return false;
      return isSubthemeInMonth(a, selectedMonth, selectedYear);
    }).length || 0;

    const pendingGlobalThemesCount = filteredThemes.filter(t => t.status === 'pending_review' || t.status === 'pending_hr_approval').length;
    setPendingValidationsCount(pendingGlobalThemesCount + pendingAlignmentsCount);

    // 4. Calculate Department Distribution & Ratings
    if (allProfiles) {
      const deptMap = {};
      allProfiles.forEach(p => {
        const d = p.department || 'Unassigned';
        if (!deptMap[d]) deptMap[d] = { total: 0, completed: 0, yes: 0, neutral: 0 };
        deptMap[d].total++;
        const review = cycleReviews?.find(r => r.employee_id === p.id);
        if (review) {
          deptMap[d].completed++;
          if (review.overall_result === 'YES') deptMap[d].yes++;
          if (review.overall_result === 'NEUTRAL') deptMap[d].neutral++;
        }
      });

      const dist = Object.keys(deptMap).map(name => ({
        name,
        pct: Math.round((deptMap[name].completed / deptMap[name].total) * 100),
        yesRate: Math.round((deptMap[name].yes / (deptMap[name].completed || 1)) * 100),
        cls: `dist-bar-${name.toLowerCase().replace(/\s+/g, '-')}`
      }));
      setDeptDistribution(dist);
    }

    // 5. Calculate Monthly Trend (Yes Rate) dynamically
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const tPoints = [];
    months.forEach(m => {
      const mReviews = cycleReviews?.filter(r => {
        if (r.review_month === m) return true;
        if (r.submitted_at && new Date(r.submitted_at).toLocaleString('en-US', { month: 'short' }).toUpperCase() === m) return true;
        return false;
      }) || [];
      if (mReviews.length > 0) {
        const mYes = mReviews.filter(r => r.overall_result === 'YES').length;
        tPoints.push({ m, v: Math.round((mYes / mReviews.length) * 100) });
      } else {
        const mIdx = months.indexOf(m);
        const curIdx = new Date().getMonth();
        if (mIdx <= curIdx && selectedYear === String(CURRENT_YEAR)) {
          tPoints.push({ m, v: 0 });
        } else if (selectedYear !== String(CURRENT_YEAR)) {
          tPoints.push({ m, v: 0 });
        }
      }
    });
    setTrendPoints(tPoints);
  }

  const depts = deptDistribution.length > 0 ? deptDistribution : [
    { name: "Engineering", pct: 0, cls: "dist-bar-engineering" },
    { name: "Product", pct: 0, cls: "dist-bar-product" },
    { name: "Marketing", pct: 0, cls: "dist-bar-marketing" },
    { name: "Operations", pct: 0, cls: "dist-bar-operations" },
    { name: "Sales", pct: 0, cls: "dist-bar-sales" },
    { name: "HR", pct: 0, cls: "dist-bar-hr" }
  ];

  // Static trendPoints removed for dynamic state

  return (
    <div className="page">
      <div className="overview-section">
        <div className="ov-hero" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="ov-hero-badge">◈ EXECUTIVE OVERVIEW · {selectedMonth} {selectedYear}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <select 
              className="input" 
              style={{ width: 100, height: 32, fontSize: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                <option key={m} value={m} style={{ color: '#000' }}>{m}</option>
              ))}
            </select>
            <select 
              className="input" 
              style={{ width: 90, height: 32, fontSize: 10, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3].map(y => <option key={y} value={y} style={{ color: '#000' }}>{y}</option>)}
            </select>
          </div>
            <div style={{ position: 'relative' }}>
              <button
                className="badge badge-red"
                style={{ cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', padding: '6px 16px', background: 'var(--red)', color: '#fff', border: 'none' }}
                onClick={() => setShowAlerts(!showAlerts)}
              >
                🔔 <span style={{ fontWeight: 800 }}>{alertCount}</span> Alerts
              </button>

              {showAlerts && (
                <div className="frame" style={{
                  position: 'absolute', right: 0, top: 45, width: 380, zIndex: 1000,
                  boxShadow: '0 15px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border)',
                  background: '#fff', textAlign: 'left'
                }}>
                  <div className="sec-title" style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>Exceptions & Alerts</div>
                  <div className="v-stack" style={{ gap: 10 }}>
                    <div className="alert-item alert-warn" style={{ fontSize: 11, padding: '8px 12px' }}>
                      <div style={{ color: 'var(--red)', flexShrink: 0 }}>⚠</div>
                      <div><strong>3 employees</strong> have received No results for 3+ consecutive months</div>
                    </div>
                    {pendingValidationsCount > 0 && (
                      <div className="alert-item alert-info" style={{ fontSize: 11, padding: '8px 12px' }}>
                        <div style={{ color: 'var(--yellow)', flexShrink: 0 }}>○</div>
                        <div><strong>{pendingValidationsCount} subtheme(s)/theme(s)</strong> pending validation — cycle closes in 4 days</div>
                      </div>
                    )}
                    <div className="alert-item alert-ok" style={{ fontSize: 11, padding: '8px 12px' }}>
                      <div style={{ color: 'var(--green)', flexShrink: 0 }}>✓</div>
                      <div>Nightly SAP Connect sync completed successfully</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <h1 className="ov-hero-title">Continuous Performance <span>Framework Dashboard</span></h1>
          <div className="ov-hero-sub">Monthly binary review cycles · Theme validation · Rolling period roll-up · SAP Connect integration</div>
        </div>

        <div className="ov-stats-row">
          <div className="ov-stat-card accent-cyan">
            <div className="ov-stat-num">{allProfilesCount}</div>
            <div className="ov-stat-label">ACTIVE EMPLOYEES</div>
            <div className="ov-stat-indicator up">↑ Synced from SAP Connect</div>
          </div>
          <div className="ov-stat-card">
            <div className="ov-stat-num">{completionRate}%</div>
            <div className="ov-stat-label">SUBMISSION COMPLETION</div>
            <div className="ov-stat-indicator up">↑ +6% vs last month</div>
          </div>
          <div className="ov-stat-card">
            <div className="ov-stat-num">{overallYesRate}%</div>
            <div className="ov-stat-label">OVERALL YES RATE</div>
            <div className="ov-stat-indicator up">↑ 2+ Yes outcomes</div>
          </div>
          <div className="ov-stat-card">
            <div className="ov-stat-num" style={{ color: 'var(--yellow)' }}>{pendingGeneral}</div>
            <div className="ov-stat-label">PENDING VALIDATIONS</div>
            <div className="ov-stat-indicator down" style={{ color: 'var(--red)' }}>↓ Themes awaiting manager</div>
          </div>
        </div>

        <div className="ov-flow-section">
          <div className="ov-flow-title">How It Works</div>
          <div className="ov-flow-wrap">
            <div className="ov-flow-step active-teal">
              <div className="ov-flow-tag">SAP Connect</div>
              <div className="ov-flow-val">Employee Data</div>
            </div>
            <div className="ov-flow-arrow">→</div>
            <div className="ov-flow-step">
              <div className="ov-flow-tag">Step 1</div>
              <div className="ov-flow-val">Manager Direction</div>
            </div>
            <div className="ov-flow-arrow">→</div>
            <div className="ov-flow-step active-purple">
              <div className="ov-flow-tag">Step 2</div>
              <div className="ov-flow-val">Employee Themes</div>
            </div>
            <div className="ov-flow-arrow">→</div>
            <div className="ov-flow-step">
              <div className="ov-flow-tag">Step 3</div>
              <div className="ov-flow-val">4 Binary Inputs</div>
            </div>
            <div className="ov-flow-arrow">→</div>
            <div className="ov-flow-step active-teal">
              <div className="ov-flow-tag">Auto Calc</div>
              <div className="ov-flow-val">Yes / No Result</div>
            </div>
            <div className="ov-flow-arrow">→</div>
            <div className="ov-flow-step">
              <div className="ov-flow-tag">Step 4</div>
              <div className="ov-flow-val">Theme Validation</div>
            </div>
            <div className="ov-flow-arrow">→</div>
            <div className="ov-flow-step active-teal">
              <div className="ov-flow-tag">Roll-up</div>
              <div className="ov-flow-val">Q / Annual View</div>
            </div>
          </div>
        </div>


        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <div className="frame" style={{ flex: 1, margin: 0, backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.7)' }}>
            <div className="sec-title">Function Rating Analysis (Yes Rate)</div>
            {depts.map(d => (
              <div key={d.name} className="bar-row">
                <div className="bar-label">{d.name}</div>
                <div className="bar-track" style={{ background: 'rgba(0,0,0,0.05)' }}>
                  <div className={`bar-fill ${d.cls}`} style={{ width: `${d.yesRate || 0}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))' }}></div>
                </div>
                <div className="bar-pct" style={{ color: 'var(--purple)', fontWeight: 800 }}>{d.yesRate || 0}%</div>
              </div>
            ))}
          </div>
          <div className="trend-chart-wrapper">
            <div className="sec-title">Monthly Trend — Yes Rate</div>
            <svg className="trend-svg" viewBox="0 0 500 120">
              {trendPoints.length > 0 && (
                <>
                  <path className="trend-line" d={trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${50 + i * (400 / Math.max(1, trendPoints.length - 1))},${110 - p.v}`).join(" ")} />
                  {trendPoints.map((p, i) => (
                    <g key={p.m}>
                      <circle className="trend-point" cx={50 + i * (400 / Math.max(1, trendPoints.length - 1))} cy={110 - p.v} />
                      <text className="trend-label" x={50 + i * (400 / Math.max(1, trendPoints.length - 1))} y="125">{p.m}</text>
                    </g>
                  ))}
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Fixed alerts section removed from bottom */}
      </div>
    </div>
  );
}

// ── ARCHITECTURE PORTAL ──
function ArchitecturePage({ profile }) {
  const blueprint = [
    {
      tier: "SAP CONNECT / SUCCESSFACTORS (CLOUD)",
      cls: "tier-green",
      items: [
        { icon: "👥", name: "Employee Central", meta: "Master Data" },
        { icon: "📊", name: "PM/GM Module", meta: "Annual Rating" },
        { icon: "🔐", name: "SAML 2.0 IdP", meta: "SSO Source" },
        { icon: "📡", name: "OData v4 API", meta: "REST Interface" }
      ]
    },
    {
      tier: "MIDDLEWARE LAYER (NODE.JS / FASTAPI)",
      cls: "tier-purple",
      divider: "↑ OData v4 GET/POST · SAML Assertions · OAuth 2.0 Tokens",
      items: [
        { icon: "🔄", name: "SF Sync Job", meta: "Nightly Cron" },
        { icon: "⚖️", name: "Decision Engine", meta: "2+ Yes = YES rule" },
        { icon: "🔑", name: "Auth Service", meta: "JWT + SAML" },
        { icon: "⬆️", name: "Score Upload", meta: "SF Write-back" },
        { icon: "🗄️", name: "PostgreSQL DB", meta: "Review Store" },
        { icon: "⚙️", name: "n8n Workflows", meta: "Automation" }
      ]
    },
    {
      tier: "FRONTEND SPA (REACT — EMPLOYEE / MANAGER / HR)",
      cls: "tier-blue",
      divider: "↑ REST API /api/v1/...",
      items: [
        { icon: "📝", name: "Employee Portal", meta: "Themes + Evidence" },
        { icon: "✅", name: "Manager Portal", meta: "Binary Inputs + Validate" },
        { icon: "📉", name: "HR Dashboard", meta: "Reports + Trends" }
      ]
    }
  ];

  const logicRules = [
    { combo: "4Y + 0N", res: "YES", cls: "green" },
    { combo: "3Y + 1N", res: "YES", cls: "green" },
    { combo: "2Y + 2N", res: "YES", cls: "green" },
    { combo: "1Y + 3N", res: "NO", cls: "red" },
    { combo: "0Y + 4N", res: "NO", cls: "red" },
    { combo: "All 16 combos", res: "Supported", cls: "purple" }
  ];

  const timeline = [
    { s: "Sprint 1 (Wk 1–2)", desc: "SF OData connection + employee sync", cls: "timeline-s1" },
    { s: "Sprint 2 (Wk 3–4)", desc: "Binary inputs + decision engine + themes", cls: "timeline-s2" },
    { s: "Sprint 3 (Wk 5–6)", desc: "Dashboards + roll-up + exceptions", cls: "timeline-s3" },
    { s: "Sprint 4 (Wk 7–8)", desc: "UAT + SF write-back + go-live", cls: "timeline-s4" }
  ];

  return (
    <div className="page architecture-section" style={{ paddingBottom: 100 }}>
      {/* 1. EXECUTIVE HERO */}
      <div className="ov-hero">
        <div className="ov-hero-badge">◈ SYSTEM ARCHITECTURE</div>
        <h1 className="ov-hero-title">Integration <span>Blueprint</span></h1>
        <div className="ov-hero-sub">SAP Connect integration · Data flows · Authentication · Tech stack · 8-week delivery</div>
      </div>



      {/* 3. TIERED ARCHITECTURE */}
      {blueprint.map((b, bi) => (
        <React.Fragment key={bi}>
          {b.divider && (
            <div className="arch-divider">
              <div className="arch-divider-text">{b.divider}</div>
            </div>
          )}
          <div className={`tier-frame ${b.cls}`}>
            <div className="tier-header">
              <div className="tier-title">{b.tier}</div>
            </div>
            <div className="arch-grid">
              {b.items.map((it, ii) => (
                <div key={ii} className="arch-card">
                  <div className="arch-card-icon">{it.icon}</div>
                  <div className="arch-card-name">{it.name}</div>
                  <div className="arch-card-meta">{it.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* 4. LOGIC & TIMELINE */}
      <div className="arch-dual-grid">
        <div className="frame" style={{ margin: 0 }}>
          <div className="sec-title" style={{ color: 'var(--cyan)' }}>DECISION LOGIC — ALL 16 COMBINATIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {logicRules.map((r, i) => (
              <div key={i} className="logic-row">
                <div className="logic-val">{r.combo}</div>
                <Badge cls={r.cls}>{r.res}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="frame" style={{ margin: 0 }}>
          <div className="sec-title" style={{ color: 'var(--purple)' }}>DELIVERY TIMELINE — 8 WEEKS</div>
          <div className="v-stack" style={{ gap: 4 }}>
            {timeline.map((t, i) => (
              <div key={i} className={`timeline-item ${t.cls}`}>
                <div className="timeline-inner">
                  <div className="timeline-title">{t.s}</div>
                  <div className="timeline-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. TECH STACK */}
      <div className="tech-stack-wrap">
        <div className="tech-card">
          <div className="tech-card-label">FRONTEND</div>
          <div className="v-stack">
            <div className="tech-item">React 18 + Vite</div>
            <div className="tech-item">Tailwind CSS + Vanilla</div>
            <div className="tech-item">React Query + Recharts</div>
            <div className="tech-item">Axios + Hook Form</div>
            <div style={{ marginTop: 12 }}><Badge cls="blue">SPA</Badge></div>
          </div>
        </div>
        <div className="tech-card">
          <div className="tech-card-label">BACKEND</div>
          <div className="v-stack">
            <div className="tech-item">Node.js 20 + Express</div>
            <div className="tech-item">Python FastAPI</div>
            <div className="tech-item">node-cron + JWT</div>
            <div className="tech-item">OData client + Passport</div>
            <div style={{ marginTop: 12 }}><Badge cls="purple">REST API</Badge></div>
          </div>
        </div>
        <div className="tech-card">
          <div className="tech-card-label">INFRASTRUCTURE</div>
          <div className="v-stack">
            <div className="tech-item">Azure App Service</div>
            <div className="tech-item">Azure PostgreSQL DB</div>
            <div className="tech-item">Manual Deployment</div>
            <div className="tech-item">n8n Automation + SFTP</div>
            <div style={{ marginTop: 12 }}><Badge cls="green">Azure / AWS</Badge></div>
          </div>
        </div>
      </div>
    </div>
  );
}

