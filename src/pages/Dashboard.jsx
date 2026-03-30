import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import {
  ShieldCheck, ArrowRightLeft, PlusCircle, PieChart, Award,
  Smartphone, BookOpen, ChevronRight, TrendingUp, TrendingDown, Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBank, spendingByCategory } from "../context/BankContext";
import TransactionCard from "../components/TransactionCard";
import PageSkeleton from "../components/PageSkeleton";
import usePageLoad from "../hooks/usePageLoad";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function StatPill({ icon: Icon, label, value, positive }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${positive ? "bg-success/10 border-success/20" : "bg-danger/10 border-danger/20"}`}>
      <Icon size={14} className={positive ? "text-success" : "text-danger"} />
      <div>
        <p className="text-white/70 text-[10px] leading-tight">{label}</p>
        <p className="text-white text-xs font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick}
      className="group flex flex-col items-center justify-center gap-2
        rounded-2xl p-4 sm:p-5 bg-bg-card border border-border-card
        hover:border-secondary/40 hover:shadow-md
        transition-all duration-150 hover:-translate-y-0.5 w-full
        min-h-[88px]"
    >
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-150`}>
        <Icon size={18} className="text-white" />
      </div>
      <span className="text-text-main text-xs sm:text-sm font-semibold text-center leading-tight">{label}</span>
    </button>
  );
}

function SpendingChart() {
  const labels = Object.keys(spendingByCategory);
  const data   = Object.values(spendingByCategory);

  const chartData = {
    labels,
    datasets: [{
      label: "Spent (₹)",
      data,
      backgroundColor: ["#FDE68A","#C4B5FD","#FED7AA","#BAE6FD","#FBCFE8"],
      borderColor:     ["#F59E0B","#8B5CF6","#F97316","#38BDF8","#EC4899"],
      borderWidth: 1.5,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1F2937",
        titleColor: "#9CA3AF",
        bodyColor: "#F9FAFB",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 10,
        callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString("en-IN")}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#485563", font: { size: 10 } }, border: { display: false } },
      y: {
        grid: { color: "#F3F4F6" },
        ticks: { color: "#485563", font: { size: 10 }, callback: (v) => `₹${(v/1000).toFixed(0)}k` },
        border: { display: false },
      },
    },
  };

  return <div className="h-40 sm:h-44 w-full"><Bar data={chartData} options={options} /></div>;
}

export default function Dashboard() {
  const { user }   = useAuth();
  const { balance, transactions, cibilScore, rewardPoints } = useBank();
  const navigate   = useNavigate();
  const loaded     = usePageLoad();

  if (!loaded) return <PageSkeleton rows={4} />;

  const firstName     = user?.name?.split(" ")[0] ?? "there";
  const recentTxn     = transactions.slice(0, 5);
  const monthlyCredit = transactions.filter((t) => t.type === "credit").reduce((s,t) => s + t.amount, 0);
  const monthlyDebit  = transactions.filter((t) => t.type === "debit").reduce((s,t)  => s + t.amount, 0);

  const quickActions = [
    { icon: PieChart,   label: "CIBIL Score", color: "bg-accent",      to: "/cibil" },
    { icon: Award,      label: "Rewards",     color: "bg-purple-600",  to: "/rewards" },
    { icon: Smartphone, label: "UPI Pay",     color: "bg-success",     to: "/payments" },
    { icon: BookOpen,   label: "Passbook",    color: "bg-orange-500",  to: "/passbook" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto page-enter">

      {/* Welcome */}
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <ShieldCheck size={14} className="text-accent" />
          <span className="text-accent text-xs font-semibold uppercase tracking-wide">Secure Banking</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-text-main">
          Welcome back, <span className="text-accent">{firstName}</span> 👋
        </h1>
        <p className="text-text-muted text-sm mt-0.5">Here's what's happening with your account today.</p>
      </div>

      {/* Balance card */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-accent p-5 sm:p-6 shadow-sm">
        <div className="pointer-events-none absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 w-36 h-36 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <Wallet size={14} className="text-white/70" />
            <p className="text-white/70 text-sm font-medium">Total Balance</p>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3 sm:mb-4">
            ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
            <StatPill icon={TrendingDown} label="Money In"  value={`₹${monthlyCredit.toLocaleString("en-IN")}`} positive />
            <StatPill icon={TrendingUp}   label="Money Out" value={`₹${monthlyDebit.toLocaleString("en-IN")}`}  positive={false} />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button onClick={() => navigate("/payments")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-primary font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all duration-150 shadow-sm min-h-[44px]">
              <ArrowRightLeft size={14} /> Transfer
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 text-white font-semibold text-sm rounded-xl hover:bg-white/25 border border-white/20 transition-all duration-150 min-h-[44px]">
              <PlusCircle size={14} /> Add Money
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions — 2 cols on mobile, 4 on sm+ */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {quickActions.map(({ icon, label, color, to }) => (
            <QuickAction key={to} icon={icon} label={label} color={color} onClick={() => navigate(to)} />
          ))}
        </div>
      </div>

      {/* Chart + Recent transactions — stacked on mobile, side by side on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm font-semibold text-text-main">Spending Summary</h2>
            <span className="text-xs text-text-muted bg-bg-page border border-border-card px-2.5 py-1 rounded-lg">Mar 2026</span>
          </div>
          <SpendingChart />
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-card flex items-center justify-between">
            <p className="text-text-muted text-xs">Total spent</p>
            <p className="text-text-main text-sm font-bold">₹{monthlyDebit.toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-bg-card border border-border-card rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-sm font-semibold text-text-main">Recent Transactions</h2>
            <button onClick={() => navigate("/passbook")}
              className="flex items-center gap-1 text-accent hover:text-accent-hover text-xs font-medium transition-colors min-h-[44px] px-2">
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {recentTxn.map((txn) => <TransactionCard key={txn.id} transaction={txn} />)}
          </div>
        </div>
      </div>

      {/* CIBIL + Rewards strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button onClick={() => navigate("/cibil")}
          className="group flex items-center justify-between bg-bg-card border border-border-card
            hover:border-accent/40 hover:shadow-sm rounded-2xl p-4 sm:p-5 text-left transition-all duration-150 min-h-[80px]">
          <div>
            <p className="text-text-muted text-sm mb-1">CIBIL Score</p>
            <p className="text-3xl font-black text-text-main">{cibilScore}</p>
            <p className="text-success text-xs mt-1 font-semibold">● Excellent</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <PieChart size={28} sm-size={32} className="text-accent group-hover:scale-110 transition-transform duration-150" />
            <ChevronRight size={13} className="text-text-muted group-hover:text-accent transition-colors" />
          </div>
        </button>

        <button onClick={() => navigate("/rewards")}
          className="group flex items-center justify-between bg-bg-card border border-border-card
            hover:border-purple-400/40 hover:shadow-sm rounded-2xl p-4 sm:p-5 text-left transition-all duration-150 min-h-[80px]">
          <div>
            <p className="text-text-muted text-sm mb-1">Reward Points</p>
            <p className="text-3xl font-black text-text-main">{rewardPoints.toLocaleString("en-IN")}</p>
            <p className="text-purple-600 text-xs mt-1 font-semibold">● Redeem now</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Award size={28} className="text-purple-500 group-hover:scale-110 transition-transform duration-150" />
            <ChevronRight size={13} className="text-text-muted group-hover:text-purple-500 transition-colors" />
          </div>
        </button>
      </div>
    </div>
  );
}
