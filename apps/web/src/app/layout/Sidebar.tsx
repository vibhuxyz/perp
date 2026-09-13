import { NavLink } from "react-router-dom";
import {
  CandlestickChart,
  History,
  Layers,
  Settings,
  GraduationCap,
} from "lucide-react";

const links = [
  { to: "/",         label: "Trade",     icon: CandlestickChart, load: () => import("@/app/routes/TradePage") },
  { to: "/positions",label: "Positions", icon: Layers,           load: () => import("@/app/routes/PositionsPage") },
  { to: "/history",  label: "History",   icon: History,          load: () => import("@/app/routes/HistoryPage") },
  { to: "/learn",    label: "Learn",     icon: GraduationCap,    load: () => Promise.resolve() },
  { to: "/settings", label: "Settings",  icon: Settings,         load: () => import("@/app/routes/SettingsPage") },
];

export function Sidebar() {
  return (
    <nav
      aria-label="Main navigation"
      className="flex w-14 sm:w-44 shrink-0 flex-col border-r border-border-subtle bg-bg-card"
    >
      {/* Nav links */}
      <div className="flex flex-col gap-0.5 p-2 flex-1">
        {links.map(({ to, label, icon: Icon, load }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onMouseEnter={load}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                "focus-visible:ring-2 focus-visible:ring-brand outline-none",
                isActive
                  ? "bg-bg-elevated text-text-primary font-medium"
                  : "text-text-secondary hover:bg-bg-elevated/50 hover:text-text-primary",
              ].join(" ")
            }
          >
            <Icon size={16} className="shrink-0" aria-hidden />
            <span className="hidden sm:inline truncate">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom separator space */}
      <div className="h-px bg-border-subtle mx-2 mb-1" />
      <div className="p-2">
        <div className="text-[10px] text-text-secondary/50 px-3 py-2 hidden sm:block">
          Practice mode active
        </div>
      </div>
    </nav>
  );
}
