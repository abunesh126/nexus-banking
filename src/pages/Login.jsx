import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Landmark } from "lucide-react";
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
  } rounded-xl px-4 py-3 text-text-main placeholder-text-muted text-sm
   focus:outline-none focus:ring-2 transition-all duration-150 min-h-[48px]`;

function validate(email, password) {
  const errs = {};
  if (!email) errs.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
  if (!password) errs.password = "Password is required.";
  else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
  return errs;
}

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const from         = location.state?.from?.pathname || "/dashboard";

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd,    setShowPwd]    = useState(false);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    login({ email, rememberMe });
    setLoading(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-bg-page px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-7">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Landmark size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-text-main">
            <span className="text-accent">Nexus</span>Bank
          </span>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-border-card rounded-2xl p-5 sm:p-7 shadow-sm">
          <h1 className="text-xl font-bold text-text-main mb-1">Welcome back</h1>
          <p className="text-text-muted text-sm mb-5">Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Email address" error={errors.email}>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input id="login-email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputCls(!!errors.email)} pl-10`}
                  placeholder="you@example.com" autoComplete="email"
                  inputMode="email" />
              </div>
            </Field>

            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input id="login-password" type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls(!!errors.password)} pl-10 pr-12`}
                  placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-0 top-0 bottom-0 px-3.5 text-text-muted hover:text-primary transition-colors flex items-center min-w-[44px] justify-center"
                  aria-label={showPwd ? "Hide password" : "Show password"}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none min-h-[44px]">
                <input id="remember-me" type="checkbox" checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border-card accent-accent" />
                <span className="text-sm text-text-main">Remember me</span>
              </label>
              <button type="button"
                className="text-sm text-accent hover:text-accent-hover font-medium transition-colors min-h-[44px] px-1">
                Forgot password?
              </button>
            </div>

            <button id="login-submit" type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold
                rounded-xl py-3 transition-all duration-150 shadow-sm min-h-[48px] text-sm">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-card" />
            <span className="text-xs text-text-muted whitespace-nowrap">Don't have an account?</span>
            <div className="flex-1 h-px bg-border-card" />
          </div>

          <Link to="/signup"
            className="block w-full text-center border border-border-card hover:border-secondary/50
              hover:bg-bg-page text-text-main text-sm font-medium rounded-xl py-3 transition-all duration-150 min-h-[48px] flex items-center justify-center">
            Create an account
          </Link>
        </div>

        <p className="mt-5 text-center text-xs text-text-muted px-4">
          Protected by 256-bit encryption · NexusBank © 2026
        </p>
      </div>
    </div>
  );
}
