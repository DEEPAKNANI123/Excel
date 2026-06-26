import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/config/supabaseClient";
import "../styles/auth.css";

import logo from "../assets/isn-logo.png";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;
      
      // Auto-handoff logic entirely shifted to App.jsx
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <img src={logo} alt="EXEL Logo" className="auth-logo" />

      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 style={{ marginBottom: "20px" }}>Sign In</h2>
          
          {errorMsg && <div style={{ background: "#ffebe9", color: "#cf222e", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", border: "1px solid rgba(255,129,130,0.4)" }}>{errorMsg}</div>}

          <form onSubmit={handleSubmit}>
            <input type="email" name="email" placeholder="Corporate Email Address" className="auth-input" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" className="auth-input" onChange={handleChange} required />

            <button className="auth-btn" disabled={loading}>
              {loading ? "Authenticating..." : "Login →"}
            </button>
          </form>

          <p style={{ marginTop: "15px" }}>
            Don't have an account? <Link to="/signup">Verify & Signup</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
