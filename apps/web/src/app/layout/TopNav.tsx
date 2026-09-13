import { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Sun, Bell, ChevronDown, PanelLeft } from 'lucide-react';
import { useAccountStore } from '@/stores/account.store';
import { useUiStore } from '@/stores/ui.store';
import { AuthModal } from '@/features/auth/AuthModal';

export function TopNav() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthOpen, setIsAuthOpen] = useState(() => searchParams.get('auth') === 'login');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, token, clearToken } = useAccountStore();
  const { toggleSidebar, sidebarCollapsed } = useUiStore();
  const isAuthenticated = Boolean(token);

  const displayName = user?.username || user?.email?.split('@')[0] || 'Student';

  const handleCloseAuth = () => {
    setIsAuthOpen(false);
    if (searchParams.get('auth')) {
      searchParams.delete('auth');
      setSearchParams(searchParams, { replace: true });
    }
  };

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

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-1.5 rounded-lg text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors cursor-pointer"
            title="Toggle theme"
          >
            <Sun className="h-4 w-4" />
          </button>

          {/* When Logged In: Bell + User Profile Pill */}
          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                className="p-1.5 rounded-lg text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#7052FF]" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(prev => !prev)}
                  title="Account menu"
                  className="flex items-center gap-2 rounded-full bg-[#121723] hover:bg-[#182030] border border-[#1C2537] px-2.5 py-1 text-xs text-white transition-all cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7052FF] text-white text-xs font-bold shadow-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-white pr-0.5">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-[#8492A6]" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#111724] border border-[#1E283C] shadow-2xl p-2 z-50 flex flex-col gap-1">
                    <div className="px-3 py-2 border-b border-[#1C263A]">
                      <p className="text-xs font-bold text-white truncate">{displayName}</p>
                      <p className="text-[11px] text-[#8492A6] truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearToken();
                        setProfileDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#FF4D5A] hover:bg-[#FF4D5A]/10 rounded-lg transition-colors cursor-pointer w-full text-left"
                    >
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* When Logged Out: Log in and Sign up buttons matching screenshot */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="rounded-xl bg-[#181D29] hover:bg-[#202737] px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="rounded-xl bg-[#7152FF] hover:bg-[#6042EE] px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer shadow-md shadow-[#7152FF]/20"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={handleCloseAuth}
      />
    </>
  );
}
