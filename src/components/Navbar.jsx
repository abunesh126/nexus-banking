import { useLocation } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

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
      sticky top-0 z-20
    ">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden flex-shrink-0 text-text-muted hover:text-primary transition-colors p-1"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
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

      {/* Right: bell + divider + user */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          aria-label="Notifications"
          className="relative text-text-muted hover:text-primary transition-colors group"
        >
          <Bell size={19} className="transition-transform duration-150 group-hover:scale-110" />
          <span className="
            absolute -top-1 -right-1 w-4 h-4 rounded-full
            bg-accent border-2 border-bg-card
            text-[9px] text-white font-bold
            flex items-center justify-center
          ">3</span>
        </button>

        <div className="w-px h-5 bg-border-card" />

        {user && (
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-text-main leading-tight">{user.name}</p>
              <p className="text-xs text-text-muted leading-tight truncate max-w-[130px]">
                {user.email}
              </p>
            </div>
            <div className="
              w-8 h-8 sm:w-9 sm:h-9 rounded-full flex-shrink-0
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
