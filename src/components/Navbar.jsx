import { useLocation } from "react-router-dom";
import { Bell, Landmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SecurityIndicator from "./SecurityIndicator";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/payments":  "Payments & UPI",
  "/cibil":     "CIBIL Score",
  "/rewards":   "Rewards",
  "/passbook":  "Passbook",
};

export default function Navbar({ onMenuClick }) {
  const { user }     = useAuth();
  const { pathname } = useLocation();
  const pageTitle    = PAGE_TITLES[pathname] ?? "NexusBank";

  return (
    <header className="
      h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between gap-3
      bg-bg-card border-b border-border-card
      sticky top-0 z-20 flex-shrink-0
    ">
      {/* Left: logo (mobile) + title */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Logo only on mobile (sidebar hidden) */}
        <div className="md:hidden flex-shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Landmark size={13} className="text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-text-main leading-tight truncate">
            {pageTitle}
          </h2>
          <p className="hidden sm:block text-xs text-text-muted leading-tight">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 justify-center">
        <SecurityIndicator />
      </div>

      {/* Right: bell + user */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        <button
          aria-label="Notifications"
          className="relative text-text-muted hover:text-primary transition-colors group min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Bell size={19} className="transition-transform duration-150 group-hover:scale-110" />
          <span className="
            absolute top-1.5 right-1.5 w-4 h-4 rounded-full
            bg-accent border-2 border-bg-card
            text-[9px] text-white font-bold
            flex items-center justify-center
          ">3</span>
        </button>

        <div className="w-px h-5 bg-border-card" />

        {user && (
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-text-main leading-tight">{user.name}</p>
              <p className="text-xs text-text-muted leading-tight truncate max-w-[130px]">
                {user.email}
              </p>
            </div>
            <div className="
              w-9 h-9 rounded-full flex-shrink-0
              bg-accent flex items-center justify-center
              text-white text-sm font-bold
              ring-2 ring-transparent group-hover:ring-accent/30
              transition-all duration-150
            ">
              {user.avatar}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
