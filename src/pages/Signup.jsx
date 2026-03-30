import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, Landmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-main">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (hasErr) =>
  `w-full bg-bg-page border ${
    hasErr ? "border-danger focus:ring-danger/30" : "border-border-card focus:ring-accent/30"
  } rounded-xl px-4 py-2.5 text-text-main placeholder-text-muted text-sm
   focus:outline-none focus:ring-2 transition-all duration-150`;

function passwordStrength(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColor = ["", "bg-danger", "bg-yellow-400", "bg-yellow-400", "bg-success"];

function validate({ fullName, email, phone, password, confirmPassword }) {
  const errs = {};
  if (!fullName.trim() || fullName.trim().length < 3) errs.fullName = "Full name must be at least 3 characters.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) errs.phone = "Enter a valid 10-digit Indian mobile number.";
  if (!password || password.length < 8) errs.password = "Must be at least 8 characters.";
  if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
  return errs;
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPwd,    setShowPwd]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strength = passwordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    signup({ fullName: form.fullName, email: form.email, phone: form.phone });
    setLoading(false);
    setSuccess(true);
    await new Promise((r) => setTimeout(r, 1200));
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Landmark size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-text-main">
            <span className="text-accent">Nexus</span>Bank
          </span>
        </div>

        <div className="bg-bg-card border border-border-card rounded-2xl p-7 shadow-sm">
          <h1 className="text-xl font-bold text-text-main mb-1">Create your account</h1>
          <p className="text-text-muted text-sm mb-6">Free forever · No hidden charges</p>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 size={48} className="text-success" />
              <p className="text-text-main font-semibold">Account created!</p>
              <p className="text-text-muted text-sm">Redirecting to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
              <Field label="Full Name" error={errors.fullName}>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input id="signup-name" type="text" value={form.fullName} onChange={set("fullName")}
                    className={`${inputCls(!!errors.fullName)} pl-10`} placeholder="Arjun Sharma" autoComplete="name" />
                </div>
              </Field>
              <Field label="Email address" error={errors.email}>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input id="signup-email" type="email" value={form.email} onChange={set("email")}
                    className={`${inputCls(!!errors.email)} pl-10`} placeholder="you@example.com" autoComplete="email" />
                </div>
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input id="signup-phone" type="tel" value={form.phone} onChange={set("phone")}
                    className={`${inputCls(!!errors.phone)} pl-10`} placeholder="9876543210" maxLength={10} />
                </div>
              </Field>
              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input id="signup-password" type={showPwd ? "text" : "password"} value={form.password} onChange={set("password")}
                    className={`${inputCls(!!errors.password)} pl-10 pr-10`} placeholder="••••••••" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {form.password && (
                  <div className="space-y-1 pt-1.5">
                    <div className="flex gap-1">
                      {[1,2,3,4].map((n) => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= strength ? strengthColor[strength] : "bg-border-card"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-text-muted">Strength: <span className={strength < 2 ? "text-danger" : strength < 4 ? "text-yellow-600" : "text-success"}>{strengthLabel[strength]}</span></p>
                  </div>
                )}
              </Field>
              <Field label="Confirm Password" error={errors.confirmPassword}>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input id="signup-confirm-password" type={showConf ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")}
                    className={`${inputCls(!!errors.confirmPassword)} pl-10 pr-10`} placeholder="••••••••" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConf(!showConf)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors">
                    {showConf ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>

              <button id="signup-submit" type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                  disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 mt-1
                  transition-all duration-150 shadow-sm">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : "Create Account"}
              </button>
            </form>
          )}

          {!success && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border-card" />
                <span className="text-xs text-text-muted">Already have an account?</span>
                <div className="flex-1 h-px bg-border-card" />
              </div>
              <Link to="/login"
                className="block w-full text-center border border-border-card hover:border-secondary/50
                  hover:bg-bg-page text-text-main text-sm font-medium rounded-xl py-2.5 transition-all duration-150">
                Sign in instead
              </Link>
            </>
          )}
        </div>
        <p className="mt-5 text-center text-xs text-text-muted">Protected by 256-bit encryption · NexusBank © 2026</p>
      </div>
    </div>
  );
}
