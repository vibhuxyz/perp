import { NavLink } from "react-router-dom";
import { CandlestickChart, History, Layers, Settings, Wallet } from "lucide-react";

const links = [
  { to: "/", label: "Trade", icon: CandlestickChart, load: () => import("@/app/routes/TradePage") },
  { to: "/positions", label: "Positions", icon: Layers, load: () => import("@/app/routes/PositionsPage") },
  { to: "/history", label: "History", icon: History, load: () => import("@/app/routes/HistoryPage") },
  { to: "/deposit", label: "Deposit", icon: Wallet, load: () => import("@/app/routes/DepositPage") },
  { to: "/settings", label: "Settings", icon: Settings, load: () => import("@/app/routes/SettingsPage") },
];

export function Sidebar() {
  return (
    <nav className="flex w-44 shrink-0 flex-col gap-1 border-r border-border-subtle bg-bg-card p-3">
      {links.map(({ to, label, icon: Icon, load }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onMouseEnter={load}
          className={({ isActive }) =>
            `flex items-center gap-2 rounded px-3 py-2 text-sm ${
              isActive
                ? "bg-bg-elevated text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`
          }
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
