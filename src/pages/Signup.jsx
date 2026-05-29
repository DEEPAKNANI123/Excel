import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/config/supabaseClient";
import "../styles/auth.css";

import logo from "../assets/exel-logo-white.png";

function Signup() {
  const [form, setForm] = useState({
    employee_id: "",
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
      // 1. Verify Employee ID exists in the database first
      const { data: checkProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('employee_id', form.employee_id.trim())
        .maybeSingle();
        
      if (checkError) {
        throw new Error(`Database Error: ${checkError.message || JSON.stringify(checkError)}`);
      }
      if (!checkProfile) {
        throw new Error("Invalid Employee ID. Contact HR to be added to the system.");
      }

      // 2. Create User in Supabase Auth securely
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Authentication layer failed.");

      // 3. Anchor new secure login to their real organization Profile via auth_email
      const { error: anchorError } = await supabase
        .from('profiles')
        .update({ auth_email: form.email })
        .eq('employee_id', form.employee_id);

      if (anchorError) throw anchorError;

      alert("Signup Successful 🎉 You are securely linked to your organizational profile!");
      navigate("/");

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during signup.");
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
          <h2 style={{ marginBottom: "20px" }}>Secure Registration</h2>
          <p style={{ marginBottom: "20px", color: "#57606a", fontSize: "14px" }}>Please verify your designated Company ID to register.</p>
          
          {errorMsg && <div style={{ background: "#ffebe9", color: "#cf222e", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", border: "1px solid rgba(255,129,130,0.4)" }}>{errorMsg}</div>}

          <form onSubmit={handleSubmit}>
            <input type="text" name="employee_id" placeholder="Company Employee ID (e.g. 400030)" className="auth-input" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Corporate Email Address" className="auth-input" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password (min 6 chars)" className="auth-input" onChange={handleChange} required />
            
            <button className="auth-btn" disabled={loading}>
              {loading ? "Verifying..." : "Secure Signup →"}
            </button>
          </form>

          <p style={{ marginTop: "15px" }}>
            Already have an account? <Link to="/">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
