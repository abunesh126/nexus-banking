import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  PieChart,
  Award,
  BookOpen,
  CreditCard, // Innovation: Virtual Cards
  Shield, // Phase 9: SOC
  LogOut,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/payments", label: "Payments", icon: Send },
  { to: "/cards", label: "Virtual Cards", icon: CreditCard }, // INNOVATION
  { to: "/cibil", label: "CIBIL Score", icon: PieChart },
  { to: "/rewards", label: "Rewards", icon: Award },
  { to: "/passbook", label: "Passbook", icon: BookOpen },
  { to: "/admin/security", label: "Security Ops", icon: Shield, adminOnly: true },
];

export default function Sidebar({ onNavClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
    onNavClick?.();
  };

  return (
    <aside
      className={`
        relative flex flex-col flex-shrink-0 h-screen sticky top-0
        bg-primary text-white
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[68px]" : "w-60"}
      `}
    >
      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="
          absolute -right-3.5 top-[68px] z-20
          w-7 h-7 rounded-full
          bg-white border border-border-card shadow-sm
          text-text-muted hover:text-primary
          flex items-center justify-center
          transition-colors duration-200
        "
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* ── Logo ── */}
      <div
        className={`
          flex items-center gap-3 border-b border-white/10 h-16 flex-shrink-0
          ${collapsed ? "justify-center px-0" : "px-5"}
          transition-all duration-300
        `}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-md">
          <Landmark size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight whitespace-nowrap">
            <span className="text-accent">Nexus</span>Bank
          </span>
        )}
      </div>

      {/* ── Nav links ── */}
      <nav className={`flex-1 py-4 space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {NAV_LINKS.filter(link => !link.adminOnly || user?.role === 'admin').map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={() => onNavClick?.()}
            className={({ isActive }) => `
              group flex items-center gap-3 rounded-xl text-sm font-medium
              transition-all duration-150 relative
              ${collapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5"}
              ${isActive
                ? "bg-accent text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className={`flex-shrink-0 transition-transform duration-150
                    group-hover:scale-110 ${isActive ? "text-white" : ""}`}
                />
                {!collapsed && (
                  <span className="whitespace-nowrap overflow-hidden">{label}</span>
                )}

                {/* Blue dot when collapsed + active */}
                {collapsed && isActive && (
                  <span className="absolute right-1.5 top-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
                )}

                {/* Tooltip on collapse */}
                {collapsed && (
                  <span className="
                    pointer-events-none absolute left-full ml-2.5 px-2.5 py-1.5
                    rounded-lg bg-primary text-white text-xs whitespace-nowrap
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    border border-white/10 shadow-xl z-50
                  ">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User + logout ── */}
      {user && (
        <div className={`border-t border-white/10 ${collapsed ? "p-2" : "p-3"}`}>
          <div className={`flex items-center gap-2.5 mb-2 ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? user.name : undefined}>
            <div className="
              w-8 h-8 flex-shrink-0 rounded-full
              bg-accent flex items-center justify-center
              text-white text-xs font-bold
            ">
              {user.avatar}
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                <p className="text-white/50 text-xs truncate">{user.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            className={`
              group flex items-center gap-2 w-full rounded-xl
              text-white/60 hover:text-danger hover:bg-danger/10
              text-sm transition-all duration-150
              ${collapsed ? "justify-center py-2" : "px-3 py-2"}
            `}
          >
            <LogOut size={15} className="flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
