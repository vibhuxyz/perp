import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Sun, Bell, ChevronDown, PanelLeft } from 'lucide-react';
import { useAccountStore } from '@/stores/account.store';
import { useUiStore } from '@/stores/ui.store';
import { AuthModal } from '@/features/auth/AuthModal';

export function TopNav() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, token, clearToken } = useAccountStore();
  const { toggleSidebar, sidebarCollapsed } = useUiStore();
  const isAuthenticated = Boolean(token);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1A2333] bg-[#0D111A] px-4 select-none z-20">
        {/* Left: Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors cursor-pointer"
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00D2FF] to-[#7052FF] shadow-md shadow-[#7052FF]/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17L12 3L21 17L12 14L3 17Z" fill="white" fillOpacity="0.95" />
                <path d="M12 14V3L21 17L12 14Z" fill="white" fillOpacity="0.75" />
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight text-white">PaperTrade</span>
          </NavLink>
        </div>

        {/* Center: Search input */}
        <div className="flex flex-1 max-w-md mx-6 justify-center">
          <div className="flex w-full items-center gap-2.5 rounded-xl border border-[#1A2333] bg-[#111622] px-3 h-8 text-xs text-[#8492A6] hover:border-[#2D3D58] transition-colors cursor-pointer group">
            <Search className="h-3.5 w-3.5 text-[#556377] group-hover:text-[#8492A6]" />
            <span className="flex-1 text-[#8492A6] text-xs">Search markets (e.g. BTC, ETH)</span>
            <kbd className="flex items-center gap-0.5 rounded border border-[#1F293D] bg-[#0A0D14] px-1.5 py-0.5 text-[10px] text-[#556377] font-mono">
              ⌘ K
            </kbd>
          </div>
        </div>

        {/* Right actions: Theme, Notification, User Profile */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 rounded-lg text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors"
            title="Toggle theme"
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#7052FF]" />
          </button>

          {/* User Account / Login button */}
          {isAuthenticated && user ? (
            <button
              type="button"
              onClick={clearToken}
              title="Click to sign out"
              className="flex items-center gap-2 rounded-xl bg-[#131824] border border-[#1A2333] hover:border-[#2A374F] px-2.5 py-1 text-xs text-white transition-all cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7052FF] text-white text-[11px] font-bold">
                {(user.username ?? user.email ?? 'S').charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-xs text-white">{user.username ?? 'Student'}</span>
              <ChevronDown className="h-3 w-3 text-[#8492A6]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#131824] border border-[#1A2333] hover:border-[#7052FF]/50 px-2.5 py-1 text-xs text-white transition-all cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7052FF] text-white text-[11px] font-bold">
                S
              </div>
              <span className="font-semibold text-xs text-white">Student</span>
              <ChevronDown className="h-3 w-3 text-[#8492A6]" />
            </button>
          )}
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
