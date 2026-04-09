import { useState, useEffect } from "react";
import { Outlet, useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Send, PieChart, Award, BookOpen, ShieldAlert, Zap
} from "lucide-react";
import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";

const BOTTOM_NAV_LINKS = [
  { to: "/dashboard", label: "Home",     icon: LayoutDashboard },
  { to: "/payments",  label: "Pay",      icon: Send            },
  { to: "/cibil",     label: "CIBIL",    icon: PieChart        },
  { to: "/rewards",   label: "Rewards",  icon: Award           },
  { to: "/passbook",  label: "Passbook", icon: BookOpen        },
];

function BottomNav() {
  return (
    <nav
      className="
        md:hidden fixed bottom-0 left-0 right-0 z-50
        bg-bg-card border-t border-border-card
        flex items-stretch
        bottom-nav-safe
      "
      aria-label="Mobile navigation"
    >
      {BOTTOM_NAV_LINKS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `
            flex-1 flex flex-col items-center justify-center gap-0.5
            py-2 px-1 min-h-[56px] transition-colors duration-150
            ${isActive
              ? "text-accent"
              : "text-text-muted hover:text-text-main active:text-accent"
            }
          `}
          aria-label={label}
        >
          {({ isActive }) => (
            <>
              <div className={`
                relative flex items-center justify-center
                w-10 h-6 rounded-xl transition-all duration-150
                ${isActive ? "bg-accent/10" : ""}
              `}>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-medium leading-tight ${isActive ? "font-semibold" : ""}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    const handleSafeMode = (e) => setIsSafeMode(e.detail.active);
    const handleRateLimit = (e) => {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 5000); // Auto-hide after 5s
    };

    window.addEventListener('NEXUS_SAFE_MODE', handleSafeMode);
    window.addEventListener('NEXUS_RATE_LIMIT', handleRateLimit);
    
    return () => {
      window.removeEventListener('NEXUS_SAFE_MODE', handleSafeMode);
      window.removeEventListener('NEXUS_RATE_LIMIT', handleRateLimit);
    };
  }, []);

  return (
    <div className="flex h-screen bg-bg-page overflow-hidden relative">
      
      {/* 🛑 GLOBAL SAFE MODE OVERLAY */}
      {isSafeMode && (
        <div className="absolute inset-0 z-[100] bg-bg-page flex flex-col items-center justify-center p-8 text-center backdrop-blur-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-6 animate-pulse border border-red-500/30">
            <ShieldAlert size={48} />
          </div>
          <h1 className="text-3xl font-black text-text-main mb-2 tracking-tight">SYSTEM LOCKED</h1>
          <p className="text-text-muted max-w-md mb-8">
            The NexusBank Security Brain has detected a Ledger Integrity Failure. 
            All financial operations are halted for forensic audit.
          </p>
          <div className="px-6 py-2 bg-text-main text-bg-page rounded-xl font-bold uppercase tracking-widest text-xs">
            Emergency Mode Active
          </div>
        </div>
      )}

      {/* ⚠️ RATE LIMIT WARNING */}
      {isRateLimited && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 bg-accent text-white rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in border-4 border-white/20">
          <Zap size={20} fill="white" />
          <div>
            <p className="text-sm font-bold">RATE LIMIT EXCEEDED</p>
            <p className="text-[10px] opacity-90">Slow down and try again in 5 seconds.</p>
          </div>
        </div>
      )}

      {/* Sidebar — desktop only */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar onNavClick={() => {}} />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => {}} />

        {/* Page content */}
        <main
          key={pathname}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-bg-page"
        >
          <div className="p-4 sm:p-6 pb-24 md:pb-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
  );
}
