import { Outlet, useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard, Send, PieChart, Award, BookOpen,
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

  return (
    <div className="flex h-screen bg-bg-page overflow-hidden">

      {/* Sidebar — desktop only */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar onNavClick={() => {}} />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => {}} />

        {/* Page content — keyed so it remounts on route change */}
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
