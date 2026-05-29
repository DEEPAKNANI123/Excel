import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabaseClient';

export default function VoiceAssistant({ profile, activeUser, setProfile, setPage, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [heardText, setHeardText] = useState("");
  const [responseText, setResponseText] = useState("Hello! I am PulseVoice. Click the mic and speak a command, or say 'Help'.");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // listen to a single command
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setHeardText("Listening...");
      };

      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setHeardText("Microphone permission denied.");
          setResponseText("Please enable microphone permissions in your browser settings to use voice controls.");
        } else {
          setHeardText("Error occurred.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        processCommand(resultText);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition not supported in this browser.");
      setResponseText("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, [profile, activeUser]);

  const speak = (text) => {
    if (!text || !synthesisRef.current) return;
    
    // Stop listening while speaking to prevent self-triggering
    const wasListening = isListening;
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    synthesisRef.current.cancel(); // clear queue
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening if it was active
      if (wasListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    synthesisRef.current.speak(utterance);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition not supported", "var(--red)");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      try {
        recognitionRef.current.start();
        setIsOpen(true);
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  const processCommand = async (text) => {
    const cleanText = text.toLowerCase().trim();
    setHeardText(text);

    // 1. Help / Usage
    if (cleanText.includes('help') || cleanText.includes('what can i say') || cleanText.includes('commands')) {
      const helpMsg = "You can navigate tabs by saying 'go to reports' or 'go to reviews'. Query stats by saying 'overall yes rate' or 'active employees'. Switch users by saying 'impersonate Supun'.";
      speak(helpMsg);
      setResponseText(helpMsg);
      return;
    }

    // 2. Navigation Commands
    if (cleanText.includes('go to') || cleanText.includes('open') || cleanText.includes('show')) {
      if (cleanText.includes('overview') || cleanText.includes('dashboard') || cleanText.includes('first page')) {
        if (profile?.role === 'hod' || profile?.role === 'hr' || profile?.role === 'md') {
          setPage('overview');
          speak("Opening executive overview.");
          setResponseText("Switched to Executive Overview.");
        } else {
          speak("Access denied. Executive overview is only available for HOD, HR, or MD roles.");
          setResponseText("Access denied: Executive Overview requires elevated permissions.");
        }
        return;
      }
      if (cleanText.includes('reviews') || cleanText.includes('employee') || cleanText.includes('my review')) {
        setPage('employee');
        speak("Opening employee reviews.");
        setResponseText("Switched to My Reviews page.");
        return;
      }
      if (cleanText.includes('manager') || cleanText.includes('validation console')) {
        if (['manager', 'hod', 'hr', 'md'].includes(profile?.role)) {
          setPage('manager');
          speak("Opening manager validation console.");
          setResponseText("Switched to Manager Console.");
        } else {
          speak("Access denied. You do not have manager privileges.");
          setResponseText("Access denied: Requires Manager privileges.");
        }
        return;
      }
      if (cleanText.includes('reports') || cleanText.includes('governance')) {
        setPage('reports');
        speak("Opening reports.");
        setResponseText("Switched to Reports page.");
        return;
      }
      if (cleanText.includes('data management') || cleanText.includes('upload') || cleanText.includes('importer')) {
        if (profile?.role === 'hr' || profile?.role === 'md') {
          setPage('upload');
          speak("Opening master data upload dashboard.");
          setResponseText("Switched to Data Management.");
        } else {
          speak("Access denied. Admin portal is restricted to HR and Managing Directors.");
          setResponseText("Access denied: Restricted to HR & MD.");
        }
        return;
      }
      if (cleanText.includes('architecture') || cleanText.includes('blueprint') || cleanText.includes('system design')) {
        if (profile?.role === 'hr' || profile?.role === 'hod' || profile?.role === 'md') {
          setPage('architecture');
          speak("Opening system architecture blueprint.");
          setResponseText("Switched to Architecture Blueprint.");
        } else {
          speak("Access denied. restricted to HR, HOD, and MD.");
          setResponseText("Access denied: Restricted to HR, HOD, and MD.");
        }
        return;
      }
      if (cleanText.includes('strategy') || cleanText.includes('strategic theme') || cleanText.includes('objectives')) {
        if (profile?.role === 'hod' || profile?.role === 'md') {
          setPage('strategy');
          speak("Opening strategic themes governance page.");
          setResponseText("Switched to Strategic Themes.");
        } else {
          speak("Access denied. Strategic themes management requires HOD or MD role.");
          setResponseText("Access denied: Restricted to HOD & MD.");
        }
        return;
      }
    }

    // 3. User Identity Query
    if (cleanText.includes('who am i') || cleanText.includes('who is logged in') || cleanText.includes('my profile')) {
      if (profile) {
        const msg = `You are logged in as ${profile.first_name} ${profile.last_name}, department ${profile.department || 'unassigned'}, holding the role of ${profile.role.toUpperCase()}.`;
        speak(msg);
        setResponseText(msg);
      } else {
        speak("You are not logged in yet.");
        setResponseText("No active profile detected.");
      }
      return;
    }

    // 4. Database Queries (Supabase integration)
    if (cleanText.includes('active employees') || cleanText.includes('registered employees') || cleanText.includes('employee count')) {
      speak("Checking employee records...");
      try {
        const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (!error) {
          const msg = `There are currently ${count} active employees registered in the system.`;
          speak(msg);
          setResponseText(msg);
        } else {
          throw error;
        }
      } catch (err) {
        speak("Sorry, I could not retrieve employee records.");
        setResponseText("Database query failed.");
      }
      return;
    }

    if (cleanText.includes('yes rate') || cleanText.includes('overall yes rate') || cleanText.includes('performance outcomes')) {
      speak("Computing outcomes...");
      try {
        const { data: reviews, error } = await supabase.from('monthly_reviews').select('overall_result');
        if (!error && reviews) {
          const total = reviews.length;
          const yesCount = reviews.filter(r => r.overall_result === 'YES').length;
          const rate = total > 0 ? Math.round((yesCount / total) * 100) : 0;
          const msg = `Out of ${total} reviews registered in the system, the overall YES performance rate is ${rate} percent.`;
          speak(msg);
          setResponseText(msg);
        } else {
          throw error;
        }
      } catch (err) {
        speak("Could not calculate outcomes.");
        setResponseText("Database calculation failed.");
      }
      return;
    }

    if (cleanText.includes('pending validation') || cleanText.includes('pending review') || cleanText.includes('what is pending')) {
      speak("Scanning the queues...");
      try {
        const { data: themes } = await supabase.from('global_themes').select('status').in('status', ['pending_review', 'pending_hr_approval']);
        const { data: alignments } = await supabase.from('employee_subtheme_alignment').select('status').in('status', ['PENDING', 'PENDING_HR_VALIDATION', 'PENDING_HOD_VALIDATION', 'PENDING_MD_VALIDATION']);
        const totalPending = (themes?.length || 0) + (alignments?.length || 0);
        const msg = `There are currently ${totalPending} validations pending. This includes ${themes?.length || 0} strategic directives and ${alignments?.length || 0} employee alignments.`;
        speak(msg);
        setResponseText(msg);
      } catch (err) {
        speak("Could not check pending items.");
        setResponseText("Pending items fetch failed.");
      }
      return;
    }

    if (cleanText.includes('active strategies') || cleanText.includes('current strategies') || cleanText.includes('read strategies')) {
      speak("Checking active strategies...");
      try {
        const { data: strategies, error } = await supabase.from('global_themes').select('title').eq('status', 'approved');
        if (!error && strategies && strategies.length > 0) {
          const titles = strategies.map(s => s.title).join(", ");
          const msg = `Active objectives are: ${titles}.`;
          speak(msg);
          setResponseText(msg);
        } else {
          const msg = "There are no approved active strategies currently.";
          speak(msg);
          setResponseText(msg);
        }
      } catch (err) {
        speak("Failed to retrieve strategies.");
      }
      return;
    }

    // 5. Impersonate user (Switch profiles helper)
    if (cleanText.includes('impersonate') || cleanText.includes('switch to')) {
      const targetName = cleanText.replace('impersonate', '').replace('switch to', '').trim();
      if (!targetName) {
        speak("Please specify a user to impersonate. For example, impersonate Supun.");
        setResponseText("Specify user name: 'Impersonate [name]'");
        return;
      }
      speak(`Searching for ${targetName}...`);
      try {
        const { data: profiles, error } = await supabase.from('profiles').select('*');
        if (!error && profiles) {
          const match = profiles.find(p => 
            p.first_name?.toLowerCase().includes(targetName) || 
            p.last_name?.toLowerCase().includes(targetName) ||
            `${p.first_name} ${p.last_name}`.toLowerCase().includes(targetName)
          );
          if (match) {
            setProfile(match);
            if (match.role === 'hod' || match.role === 'hr') {
              setPage("overview");
            } else if (match.role === 'manager') {
              setPage("manager");
            } else {
              setPage("employee");
            }
            showToast(`Now acting as ${match.first_name} ${match.last_name}`, "var(--purple)");
            const msg = `Profile switch successful. Acting as ${match.first_name} ${match.last_name}, department ${match.department || 'unassigned'}.`;
            speak(msg);
            setResponseText(msg);
          } else {
            const msg = `I could not find anyone named ${targetName} in the system profile list.`;
            speak(msg);
            setResponseText(msg);
          }
        } else {
          throw error;
        }
      } catch (err) {
        speak("Directory search failed.");
      }
      return;
    }

    // 6. Propose a Strategic Theme command
    if (cleanText.startsWith('propose theme') || cleanText.startsWith('create theme') || cleanText.startsWith('add theme')) {
      const themeTitle = text.replace(/propose theme/i, '').replace(/create theme/i, '').replace(/add theme/i, '').trim();
      if (!themeTitle) {
        speak("Please specify a theme title. For example, propose theme AI Integration.");
        setResponseText("Specify theme name: 'Propose theme [name]'");
        return;
      }
      
      speak(`Writing theme proposal for ${themeTitle}...`);
      const isHOD = profile?.role === 'hod' || profile?.role === 'md';
      const currentYear = new Date().getFullYear();

      try {
        const themeRecord = {
          title: themeTitle,
          description: `[Voice Proposal] Strategic directive proposed via PulseVoice assistance.`,
          created_by: activeUser || profile?.id,
          status: isHOD ? 'approved' : 'pending_hod_validation',
          cycle_id: String(currentYear),
          department: profile?.department || null,
          is_active: isHOD ? 'true' : 'false'
        };

        const { error } = await supabase.from('global_themes').insert([themeRecord]);
        if (!error) {
          const msg = isHOD 
            ? `Strategic theme ${themeTitle} has been published and is active.` 
            : `Theme proposal for ${themeTitle} has been sent to the HOD validation queue.`;
          speak(msg);
          setResponseText(msg);
          showToast(msg, "var(--green)");
        } else {
          throw error;
        }
      } catch (err) {
        speak("Sorry, I encountered database errors submitting the theme.");
        setResponseText("Failed to insert theme record.");
      }
      return;
    }

    // Default unrecognized
    const defaultMsg = `I heard you say: "${text}". Say "Help" to see a list of actions I can take.`;
    speak(defaultMsg);
    setResponseText(defaultMsg);
  };

  const SUGGESTIONS = [
    { text: "Help", label: "Show Help" },
    { text: "Who am I?", label: "Identify Active User" },
    { text: "Go to Reports", label: "Open Reports Screen" },
    { text: "Go to Executive Dashboard", label: "Open Overview Dashboard" },
    { text: "Go to My Reviews", label: "Open Employee Reviews" },
    { text: "How many active employees?", label: "Count Registered Staff" },
    { text: "What is the overall yes rate?", label: "Compute Performance YES rate" },
    { text: "Show pending validations", label: "Count Pending Approvals" },
    { text: "Read active strategies", label: "List Strategic Objectives" },
    { text: "Impersonate Supun", label: "Test Switch Profile (Dev)" }
  ];

  const handleSuggestionClick = (cmdText) => {
    processCommand(cmdText);
  };

  return (
    <div className="voice-assistant-container">
      {/* Floating Action Button */}
      <button 
        className={`pulsevoice-btn ${isListening ? 'listening' : ''}`}
        onClick={toggleListen}
        onMouseEnter={() => setIsOpen(true)}
        title="PulseVoice Assistant"
        style={{ outline: 'none' }}
      >
        🎙️
      </button>

      {/* Floating Info Panel */}
      <div className={`pulsevoice-panel ${isOpen ? 'active' : ''}`}>
        <div className="pulsevoice-header">
          <div className="pulsevoice-title">
            <span>✨ PulseVoice Assist</span>
          </div>
          <div className="h-stack" style={{ gap: 8 }}>
            <span className="pulsevoice-status">
              {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Idle'}
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              title="Close panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Visualizer Wave */}
        <div className={`pulsevoice-wave ${(isListening || isSpeaking) ? 'animating' : ''}`}>
          <div className="pulsevoice-wave-bar"></div>
          <div className="pulsevoice-wave-bar"></div>
          <div className="pulsevoice-wave-bar"></div>
          <div className="pulsevoice-wave-bar"></div>
          <div className="pulsevoice-wave-bar"></div>
        </div>

        {/* Heard Speech Box */}
        {heardText && (
          <div className="pulsevoice-speech-box">
            <strong>Heard:</strong> "{heardText}"
          </div>
        )}

        {/* System Response Box */}
        <div className="pulsevoice-response-box">
          {responseText}
        </div>

        {/* Suggestion Chips */}
        {showSuggestions && (
          <div className="pulsevoice-suggestions">
            <div className="pulsevoice-suggestion-title">Voice Suggestions</div>
            <div className="pulsevoice-suggestion-list">
              {SUGGESTIONS.map((s, idx) => (
                <div 
                  key={idx} 
                  className="pulsevoice-suggestion-item"
                  onClick={() => handleSuggestionClick(s.text)}
                  title={s.label}
                >
                  🗣️ "{s.text}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
