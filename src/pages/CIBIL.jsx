import React, { useRef, useState } from "react";
import usePageLoad from "../hooks/usePageLoad";
import PageSkeleton from "../components/PageSkeleton";
import { Doughnut, Line } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from "chart.js";
import { Info, CheckCircle2, AlertCircle, Clock, CreditCard, TrendingUp, Lightbulb, ShieldCheck, ChevronRight } from "lucide-react";
import { useBank } from "../context/BankContext";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const SCORE_MIN = 300;
const SCORE_MAX = 900;
const SCORE_RANGE = 600;

/* CIBIL zones with new accent palette */
const ZONES = [
  { label: "Poor",      min: 300, max: 549, color: "#DC2626" }, // danger
  { label: "Fair",      min: 550, max: 649, color: "#F59E0B" },
  { label: "Good",      min: 650, max: 749, color: "#2563EB" }, // accent
  { label: "Excellent", min: 750, max: 900, color: "#16A34A" }, // success
];
function getZone(score) { return ZONES.find((z) => score >= z.min && score <= z.max) ?? ZONES[0]; }

const HISTORY_LABELS = ["Oct","Nov","Dec","Jan","Feb","Mar"];
const HISTORY_DATA   = [710,718,725,731,738,742];

function GaugeChart({ score }) {
  const zone     = getZone(score);
  const gaugeRef = useRef(null);
  const segments = ZONES.map((z) => z.max - z.min + 1);
  const filled   = score - SCORE_MIN;
  const empty    = SCORE_RANGE - filled;

  const data = {
    datasets: [
      { data: segments, backgroundColor: ZONES.map((z) => z.color + "30"), borderColor: ZONES.map((z) => z.color + "80"), borderWidth: 1.5, borderRadius: 4, spacing: 2, weight: 2 },
      { data: [filled, empty], backgroundColor: [zone.color, "transparent"], borderColor: [zone.color, "transparent"], borderWidth: [2,0], borderRadius: [6,0], weight: 3 },
    ],
  };

  const centreTextPlugin = {
    id: "centreText",
    afterDraw(chart) {
      const { ctx, chartArea: { left, right, bottom } } = chart;
      const cx = (left + right) / 2;
      ctx.save();
      ctx.font = "bold 40px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(score, cx, bottom - 6);
      ctx.font = "600 13px Inter, system-ui, sans-serif";
      ctx.fillStyle = zone.color;
      ctx.textBaseline = "top";
      ctx.fillText(zone.label, cx, bottom - 2);
      ctx.restore();
    },
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    rotation: -90, circumference: 180, cutout: "72%",
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    animation: { animateRotate: true, duration: 1000, easing: "easeOutQuart" },
  };

  return (
    <div className="relative w-full max-w-[270px] mx-auto" style={{ height: 163 }}>
      <Doughnut ref={gaugeRef} data={data} options={options} plugins={[centreTextPlugin]} />
    </div>
  );
}

function ScaleLegend() {
  return (
    <div className="flex gap-1 mt-2 w-full max-w-[270px] mx-auto">
      {ZONES.map((z) => (
        <div key={z.label} className="flex-1 text-center">
          <div className="h-1.5 rounded-full mb-1" style={{ backgroundColor: z.color }} />
          <p className="text-[10px] text-text-muted">{z.min}</p>
        </div>
      ))}
      <div className="text-center"><div className="h-1.5 mb-1" /><p className="text-[10px] text-text-muted">900</p></div>
    </div>
  );
}

function FactorCard({ icon: Icon, label, value, sub, barColor, barPct, iconBg }) {
  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm hover:border-secondary/40 hover:shadow-md transition-all duration-150">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-base font-black text-text-main">{value}</span>
      </div>
      <p className="text-text-main text-sm font-semibold">{label}</p>
      <p className="text-text-muted text-xs mb-3">{sub}</p>
      {typeof barPct === "number" && (
        <div className="h-1.5 bg-bg-page border border-border-card rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
      )}
    </div>
  );
}

function HistoryChart() {
  const data = {
    labels: HISTORY_LABELS,
    datasets: [{
      label: "CIBIL Score",
      data: HISTORY_DATA,
      borderColor: "#2563EB",
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0,0,0,200);
        g.addColorStop(0, "rgba(37,99,235,0.15)");
        g.addColorStop(1, "rgba(37,99,235,0)");
        return g;
      },
      borderWidth: 2, pointBackgroundColor: "#2563EB", pointBorderColor: "#FFFFFF",
      pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7, tension: 0.4, fill: true,
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1F2937", titleColor: "#9CA3AF", bodyColor: "#F9FAFB", borderColor: "#374151", borderWidth: 1, padding: 10, callbacks: { label: (c) => ` Score: ${c.raw}` } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#485563", font: { size: 11 } }, border: { display: false } },
      y: { min: 680, max: 780, grid: { color: "#F3F4F6" }, ticks: { color: "#485563", font: { size: 11 }, stepSize: 20 }, border: { display: false } },
    },
    animation: { duration: 1000, easing: "easeOutQuart" },
  };
  return <div style={{ height: 195 }}><Line data={data} options={options} /></div>;
}

const SCORE_FACTORS = [
  { icon: CheckCircle2, label: "Payment History",    value: "95%",   sub: "On-time payments",     barColor: "bg-success",  barPct: 95,   iconBg: "bg-success" },
  { icon: CreditCard,   label: "Credit Utilisation", value: "38%",   sub: "Recommended < 30%",    barColor: "bg-yellow-400", barPct: 38, iconBg: "bg-yellow-500" },
  { icon: Clock,        label: "Credit Age",         value: "4 yrs", sub: "Average account age",  barColor: "bg-accent",   barPct: 65,   iconBg: "bg-accent" },
  { icon: AlertCircle,  label: "Total Accounts",     value: "3",     sub: "Active credit lines",  barColor: "bg-secondary", barPct: null, iconBg: "bg-secondary" },
];

const TIPS = [
  { icon: TrendingUp,  color: "text-success",  bg: "bg-success/5 border-success/20",             title: "Reduce credit utilisation",          body: "Keep credit card usage below 30% of the limit. Try paying your bill twice a month." },
  { icon: ShieldCheck, color: "text-accent",   bg: "bg-accent/5 border-accent/20",               title: "Never miss a due date",              body: "Set auto-pay or reminders for all EMIs and credit card bills. Even one missed payment can drop your score by 50–100 points." },
  { icon: Lightbulb,   color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200",           title: "Avoid multiple loan applications",    body: "Each hard enquiry lowers your score. Space out loan/card applications and compare offers before applying." },
];

export default function CIBIL() {
  const { cibilScore } = useBank();
  const score  = cibilScore ?? 742;
  const zone   = getZone(score);
  const loaded = usePageLoad();
  const [showTip, setShowTip] = useState(false);
  const pct = Math.round(((score - SCORE_MIN) / SCORE_RANGE) * 100);

  if (!loaded) return <PageSkeleton rows={3} />;

  return (
    <div className="space-y-5 max-w-4xl mx-auto page-enter">

      {/* Header */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-text-main">CIBIL Score</h1>
        <div className="relative">
          <button onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
            onClick={() => setShowTip((v) => !v)}
            className="text-text-muted hover:text-accent transition-colors" aria-label="What is CIBIL?">
            <Info size={17} />
          </button>
          {showTip && (
            <div className="absolute left-6 top-0 z-50 w-72 bg-bg-card border border-border-card rounded-xl p-4 shadow-lg text-sm text-text-muted leading-relaxed">
              <p className="font-semibold text-text-main mb-1">What is a CIBIL Score?</p>
              A CIBIL score (300–900) reflects your creditworthiness based on repayment history. Scores above 750 are considered excellent by most lenders.
            </div>
          )}
        </div>
      </div>

      {/* Gauge + History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <p className="text-text-muted text-sm mb-4">Your Credit Score</p>
          <GaugeChart score={score} />
          <ScaleLegend />
          <div className="mt-4 px-4 py-1.5 rounded-full text-sm font-semibold border"
               style={{ color: zone.color, borderColor: zone.color + "50", backgroundColor: zone.color + "10" }}>
            {zone.label} · {score} / {SCORE_MAX}
          </div>
          <div className="mt-4 w-full max-w-[270px]">
            <div className="h-2 rounded-full bg-bg-page border border-border-card overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: zone.color }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-text-muted">{SCORE_MIN} Poor</span>
              <span className="text-xs text-text-muted">Excellent {SCORE_MAX}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-main">Score History</h2>
            <span className="text-xs text-text-muted bg-bg-page border border-border-card px-2.5 py-1 rounded-lg">Last 6 months</span>
          </div>
          <HistoryChart />
          <div className="mt-4 pt-4 border-t border-border-card flex items-center justify-between">
            <p className="text-text-muted text-xs">Change since Oct 2025</p>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={13} className="text-success" />
              <span className="text-success text-sm font-bold">+{HISTORY_DATA.at(-1) - HISTORY_DATA[0]} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Factors */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Score Factors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SCORE_FACTORS.map((f) => <FactorCard key={f.label} {...f} />)}
        </div>
      </div>

      {/* Tips */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">How to Improve Your Score</h2>
        <div className="space-y-3">
          {TIPS.map((tip, i) => (
            <div key={i} className={`flex items-start gap-4 rounded-2xl p-5 border ${tip.bg} hover:shadow-sm transition-all duration-150`}>
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border border-border-card flex items-center justify-center">
                <tip.icon size={19} className={tip.color} />
              </div>
              <div className="flex-1">
                <p className="text-text-main font-semibold text-sm mb-1">{tip.title}</p>
                <p className="text-text-muted text-xs leading-relaxed">{tip.body}</p>
              </div>
              <ChevronRight size={15} className="flex-shrink-0 text-text-muted mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
