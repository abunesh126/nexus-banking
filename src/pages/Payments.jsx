import { useState, useEffect } from "react";
import { Send, IndianRupee, FileText, CheckCircle2, XCircle, AlertCircle, Loader2, X, Clock, Zap } from "lucide-react";
import { useBank } from "../context/BankContext";
import TransactionCard from "../components/TransactionCard";

const QUICK_CONTACTS = [
  { name: "Priya Sharma", upiId: "priya.sharma@okicici", emoji: "👩" },
  { name: "Rahul Verma", upiId: "rahul.v@okhdfcbank", emoji: "👨" },
  { name: "Anjali Mehta", upiId: "anjali.m@oksbi", emoji: "👧" },
  { name: "Kiran Nair", upiId: "kiran.nair@okaxis", emoji: "🧑" },
];

const inputCls = (err) =>
  `w-full bg-bg-page border ${err ? "border-danger focus:ring-danger/30" : "border-border-card focus:ring-accent/30"}
   rounded-xl px-4 py-3 text-text-main placeholder-text-muted text-sm
   focus:outline-none focus:ring-2 transition-all duration-150 min-h-[48px]`;

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-main">{label}</label>
      {children}
      {error && <p className="flex items-center gap-1.5 text-xs text-danger"><AlertCircle size={11} /> {error}</p>}
    </div>
  );
}

function ConfirmModal({ upiId, amount, note, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full sm:max-w-sm bg-bg-card border border-border-card
           sm:rounded-2xl rounded-t-2xl p-6 shadow-xl"
        style={{ animation: "slideUp .2s ease" }}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={17} />
        </button>
        <h3 className="text-base font-bold text-text-main mb-5">Confirm Payment</h3>
        <div className="space-y-2.5 mb-6">
          {[["To", upiId], ["Amount", `₹${Number(amount).toLocaleString("en-IN")}`], ...(note ? [["Note", note]] : [])].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center bg-bg-page border border-border-card rounded-xl px-4 py-2.5">
              <span className="text-text-muted text-sm">{k}</span>
              <span className={`text-text-main text-sm font-semibold truncate ml-4 max-w-[180px] ${k === "Amount" ? "text-lg font-black" : ""}`}>{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-border-card text-text-muted hover:bg-bg-page rounded-xl py-3 text-sm font-medium transition-all duration-150 min-h-[48px]">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-green-700 disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-all duration-150 min-h-[48px]">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            {loading ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ type, message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const isSuccess = type === "success";
  return (
    <div className={`fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border
      ${isSuccess ? "bg-bg-card border-success/30" : "bg-bg-card border-danger/30"}
      animate-[slideUp_.2s_ease]`}>
      {isSuccess ? <CheckCircle2 size={17} className="text-success flex-shrink-0" /> : <XCircle size={17} className="text-danger flex-shrink-0" />}
      <p className="text-sm font-medium text-text-main flex-1">{message}</p>
      <button onClick={onClose} className="ml-2 text-text-muted hover:text-text-main min-w-[32px] flex items-center justify-center"><X size={13} /></button>
    </div>
  );
}

function validate(upiId, amount, balance) {
  const errs = {};
  if (!upiId.trim()) errs.upiId = "UPI ID is required.";
  else if (!upiId.includes("@")) errs.upiId = "UPI ID must contain @ (e.g. name@okicici).";
  const num = Number(amount);
  if (!amount) errs.amount = "Amount is required.";
  else if (isNaN(num) || num <= 0) errs.amount = "Enter a valid positive amount.";
  else if (num > balance) errs.amount = `Insufficient balance. Available: ₹${balance.toLocaleString("en-IN")}`;
  return errs;
}

export default function Payments() {
  const { balance, transactions, sendMoney } = useBank();
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const recentPayments = transactions.slice(0, 5);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(upiId, amount, balance);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // INNOVATION: Behavioral Biometrics (Typing/Submit Rhythm)
    // If the user submits too fast (bot-like) or the interval is unusual
    const now = Date.now();
    const duration = now - lastSubmitTime;
    setLastSubmitTime(now);

    setErrors({});
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setModalLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200)); // Processing simulation
      sendMoney({ upiId, amount, note });
      setToast({ type: "success", message: `₹${Number(amount).toLocaleString("en-IN")} sent to ${upiId}` });
      setUpiId(""); setAmount(""); setNote("");
    } catch (err) {
      // Handle AI Risk Scoring alerts
      setToast({ type: "error", message: err.message });
    } finally {
      setModalLoading(false);
      setShowModal(false);
    }
  };

  return (
    <>
      {showModal && <ConfirmModal upiId={upiId} amount={amount} note={note} onConfirm={handleConfirm} onCancel={() => setShowModal(false)} loading={modalLoading} />}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
            <Send size={17} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-main">Payments & UPI</h1>
            <p className="text-text-muted text-sm">Send money instantly to any UPI ID</p>
          </div>
        </div>

        {/* Balance pill */}
        <div className="inline-flex items-center gap-2 bg-bg-card border border-border-card rounded-full px-4 py-2 shadow-sm">
          <IndianRupee size={13} className="text-success" />
          <span className="text-text-muted text-sm">Available:</span>
          <span className="text-text-main font-bold text-sm">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Form + Recent grid — stacked on mobile, side by side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Send Money Form */}
          <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
              <Send size={14} className="text-accent" /> Send Money
            </h2>

            {/* Quick Pay contacts */}
            <div className="mb-5">
              <p className="text-xs text-text-muted mb-2.5 flex items-center gap-1.5">
                <Zap size={11} className="text-yellow-500" /> Quick Pay
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_CONTACTS.map((c) => (
                  <button key={c.upiId}
                    onClick={() => { setUpiId(c.upiId); setErrors((e) => ({ ...e, upiId: undefined })); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-150 min-h-[52px]
                      ${upiId === c.upiId ? "bg-accent/10 border-accent/40 text-accent" : "bg-bg-page border-border-card text-text-main hover:border-secondary/40"}`}>
                    <span className="text-base flex-shrink-0">{c.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{c.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{c.upiId}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border-card mb-5" />

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Field label="UPI ID" error={errors.upiId}>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm select-none pointer-events-none">@</span>
                  <input id="upi-id" type="text" value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setErrors((er) => ({ ...er, upiId: undefined })); }}
                    className={`${inputCls(errors.upiId)} pl-8`}
                    placeholder="name@okicici" autoComplete="off"
                    inputMode="email" />
                </div>
              </Field>

              <Field label="Amount (₹)" error={errors.amount}>
                <div className="relative">
                  <IndianRupee size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input id="upi-amount" type="number" min="1" value={amount}
                    onChange={(e) => { setAmount(e.target.value); setErrors((er) => ({ ...er, amount: undefined })); }}
                    className={`${inputCls(errors.amount)} pl-9`}
                    placeholder="0.00"
                    inputMode="decimal" />
                </div>
              </Field>

              <Field label="Note (optional)">
                <div className="relative">
                  <FileText size={13} className="absolute left-3.5 top-3.5 text-text-muted pointer-events-none" />
                  <input id="upi-note" type="text" value={note} onChange={(e) => setNote(e.target.value)}
                    className={`${inputCls(false)} pl-9`}
                    placeholder="Rent, lunch, etc." maxLength={50} />
                </div>
              </Field>

              {/* Sticky submit button on mobile */}
              <div className="pt-1">
                <button id="upi-pay-btn" type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700 text-white font-semibold rounded-xl py-3 transition-all duration-150 shadow-sm min-h-[52px]">
                  <Send size={15} /> Pay Now
                </button>
              </div>
            </form>
          </div>

          {/* Recent payments */}
          <div className="lg:col-span-3 bg-bg-card border border-border-card rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-text-main mb-4 flex items-center gap-2">
              <Clock size={14} className="text-text-muted" /> Recent Payments
            </h2>
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Send size={28} className="text-border-card mb-3" />
                <p className="text-text-muted text-sm">No payments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((txn) => <TransactionCard key={txn.id} transaction={txn} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
