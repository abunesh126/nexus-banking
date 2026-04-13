import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Landmark, ShieldCheck } from "lucide-react";
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
  `w-full bg-bg-page border ${hasErr ? "border-danger focus:ring-danger/30" : "border-border-card focus:ring-accent/30"
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
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalErr, setGeneralErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Simple OTP Implementation
  const [otpMode, setOtpMode] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate(email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setGeneralErr("");
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 700));
      // First Step: Verify Password via Supabase
      await login({ email, password, rememberMe });

      // Password correct! Now generate OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(otp);
      setOtpMode(true);

      // We removed the alert() to use the new UI-based OTP banner instead.
    } catch (err) {
      setGeneralErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 500));
      if (enteredOtp === generatedOtp) {
        navigate(from, { replace: true });
      } else {
        setGeneralErr("Invalid OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ email: "Enter your email first to reset password." });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      alert("Password reset email sent (check your spam folder).");
    } catch (err) {
      setGeneralErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-bg-page px-4 py-8 relative overflow-hidden">

      {/* Visual OTP Banner (Simulated secure notification) */}
      {otpMode && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px] z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-primary/95 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Nexus Safe-Token</p>
              <p className="text-sm font-medium text-white italic">Your secondary code is <span className="text-lg font-black not-italic text-white underline decoration-accent decoration-2 underline-offset-4">{generatedOtp}</span></p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm text-left relative z-10 transition-all duration-300">
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
        <div className={`bg-bg-card border border-border-card rounded-2xl p-5 sm:p-7 shadow-sm transition-all duration-300 ${otpMode ? "border-primary shadow-primary/10" : ""}`}>
          <h1 className="text-xl font-bold text-text-main mb-1">
            {otpMode ? "Secure Authentication" : "Welcome back"}
          </h1>
          <p className="text-text-muted text-sm mb-5">
            {otpMode ? "Verification required for institutional access" : "Sign in to your account"}
          </p>

          {generalErr && (
            <div className="mb-5 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
              <AlertCircle size={16} className="text-danger mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold text-danger leading-relaxed">{generalErr}</p>
            </div>
          )}

          {!otpMode ? (
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
                <button type="button" onClick={handleForgotPassword}
                  className="text-sm text-accent hover:text-accent-hover font-medium transition-colors min-h-[44px] px-1">
                  Forgot password?
                </button>
              </div>

              <button id="login-submit" type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                  disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold
                  rounded-xl py-3 transition-all duration-150 shadow-sm min-h-[48px] text-sm">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in duration-500">
              <Field label="Safe-Token Code" error={errors.otp}>
                <div className="relative">
                  <ShieldCheck size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input id="login-otp" type="text" value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className={`${inputCls(!!errors.otp)} pl-10 text-center tracking-[1em] text-xl font-black text-primary`}
                    placeholder="0000" maxLength={4} autoComplete="one-time-code" inputMode="numeric" autoFocus />
                </div>
              </Field>

              <button id="otp-submit" type="submit" disabled={loading || enteredOtp.length !== 4}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover
                  disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold
                  rounded-xl py-3 transition-all duration-150 shadow-md transform active:scale-[0.98] min-h-[48px] text-sm tracking-wide">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Authorizing…</> : "Finalize Login"}
              </button>

              <button type="button" onClick={() => setOtpMode(false)}
                className="w-full text-center text-xs text-text-muted hover:text-text-main transition-colors py-2 font-medium">
                Try different account
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-card" />
            <span className="text-xs text-text-muted whitespace-nowrap">Access Options</span>
            <div className="flex-1 h-px bg-border-card" />
          </div>

          <Link to="/signup"
            className="block w-full text-center border border-border-card hover:border-secondary/50
                  hover:bg-bg-page text-text-main text-sm font-medium rounded-xl py-3 transition-all duration-150 min-h-[48px] flex items-center justify-center">
            New Institutional Client
          </Link>
        </div>

        <p className="mt-5 text-center text-[10px] text-text-muted px-4 uppercase tracking-widest opacity-60">
          NexusBank · AES-256-GCM Hardened · 2026
        </p>
      </div>
    </div>
  );
}
