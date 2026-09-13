import { NavLink } from 'react-router-dom';
import {
  CandlestickChart,
  GraduationCap,
  Activity,
  PlayCircle,
  FlaskConical,
  Newspaper,
  Trophy,
  Award,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useUiStore } from '@/stores/ui.store';

const MENU_ITEMS = [
  { to: '/',            label: 'Trade',        icon: CandlestickChart, end: true },
  { to: '/learn',       label: 'Learn',        icon: GraduationCap,   end: false },
  { to: '/simulations', label: 'Simulations',  icon: Activity,        end: false },
  { to: '/tutorials',   label: 'Tutorials',    icon: PlayCircle,      end: false },
  { to: '/strategy',    label: 'Strategy Lab', icon: FlaskConical,    end: false },
  { to: '/news',        label: 'Market News',  icon: Newspaper,       end: false },
  { to: '/leaderboard', label: 'Leaderboard',  icon: Trophy,          end: false },
  { to: '/achievements',label: 'Achievements', icon: Award,           end: false },
];

function ProgressGauge({ percent = 60, compact = false }: { percent?: number; compact?: boolean }) {
  const radius = compact ? 16 : 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const size = compact ? 40 : 56;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${compact ? 'w-10 h-10' : 'w-14 h-14'}`}>
      <svg className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} -rotate-90`} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1B2435"
          strokeWidth={compact ? 3 : 4}
          fill="none"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00F29D"
          strokeWidth={compact ? 3 : 4}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-white tabular-nums`}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

export function LeftSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <aside
      className={[
        'shrink-0 border-r border-[#1A2333] bg-[#0D111A] flex flex-col justify-between overflow-y-auto scrollbar-thin select-none z-10 transition-all duration-200 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-52',
      ].join(' ')}
    >
      {/* Top Section: Promo Callout / Compact Button + Menu */}
      <div className="flex flex-col">
        {!sidebarCollapsed ? (
          /* Expanded Promo Box */
          <div className="p-3.5 m-2.5 rounded-xl bg-gradient-to-b from-[#131926] to-[#0E131E] border border-[#1A2333] relative">
            <button
              type="button"
              onClick={toggleSidebar}
              title="Collapse sidebar"
              className="absolute top-2.5 right-2.5 text-[#8492A6] hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
            <h2 className="text-sm font-extrabold text-white leading-tight pr-5">
              Practice. Learn.<br />Trade.
            </h2>
            <p className="mt-1 text-[11px] text-[#8492A6] leading-relaxed">
              Real markets. Fake money.<br />Real skills for the real world.
            </p>
            <NavLink
              to="/learn"
              className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#7052FF] hover:bg-[#6142EE] text-white text-xs font-semibold py-2 px-3 transition-all shadow-md shadow-[#7052FF]/20 cursor-pointer"
            >
              <span>Start Learning</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        ) : (
          /* Collapsed Top: Toggle Button + Learn Shortcut */
          <div className="flex flex-col items-center gap-2 pt-3 pb-1 border-b border-[#1A2333]/50">
            <button
              type="button"
              onClick={toggleSidebar}
              title="Expand sidebar"
              className="p-2 rounded-lg text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            <NavLink
              to="/learn"
              title="Start Learning"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7052FF] hover:bg-[#6142EE] text-white transition-colors shadow-xs"
            >
              <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        )}

        {!sidebarCollapsed && <div className="h-px bg-[#1A2333] mx-3 my-1" />}

        {/* Navigation Menu Links */}
        <nav className={`flex flex-col gap-1 ${sidebarCollapsed ? 'px-2 py-2 items-center' : 'p-2'}`}>
          {MENU_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center rounded-lg transition-all relative group cursor-pointer',
                  sidebarCollapsed
                    ? 'justify-center w-10 h-10 p-0'
                    : 'gap-3 px-3 py-2 text-xs font-medium w-full',
                  isActive
                    ? 'bg-[#151D2C] text-white font-semibold shadow-xs'
                    : 'text-[#8492A6] hover:text-white hover:bg-[#121724]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  {/* Left active cyan bar indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#00D2FF]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#00D2FF]' : 'text-[#6A788E] group-hover:text-white'
                    }`}
                  />
                  {!sidebarCollapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Progress Indicator */}
      <div className={sidebarCollapsed ? 'p-2 flex flex-col items-center mt-auto pb-3' : 'p-2.5 mt-auto'}>
        {!sidebarCollapsed ? (
          /* Expanded Progress Card */
          <div className="rounded-xl border border-[#1A2333] bg-[#111622] p-3 flex flex-col gap-2.5 shadow-sm">
            <span className="text-xs font-semibold text-white">Your Progress</span>
            <div className="flex items-center gap-3">
              <ProgressGauge percent={60} />
              <p className="text-[11px] text-[#8492A6] leading-tight">
                Complete 5 lessons to unlock advanced strategies.
              </p>
            </div>
            <NavLink
              to="/learn"
              className="flex items-center justify-center w-full rounded-lg bg-[#182132] hover:bg-[#202C42] border border-[#233047] text-[#00D2FF] text-xs font-semibold py-1.5 transition-colors cursor-pointer"
            >
              Continue Learning
            </NavLink>
          </div>
        ) : (
          /* Collapsed Mini Progress Gauge */
          <NavLink
            to="/learn"
            title="Your Progress: 60% - Click to continue learning"
            className="flex flex-col items-center p-1.5 rounded-xl hover:bg-[#131824] transition-colors"
          >
            <ProgressGauge percent={60} compact />
          </NavLink>
        )}
      </div>
    </aside>
  );
}
