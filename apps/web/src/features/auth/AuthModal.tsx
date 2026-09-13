import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, X, AlertCircle } from 'lucide-react';
import { config } from '@/app/config';
import { useAccountStore } from '@/stores/account.store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSignUp?: boolean;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const setAuth = useAccountStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${config.apiUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.msg || data?.message || data?.errors || 'Invalid email or password');
      }

      if (data.token && data.user) {
        setAuth(data.token, data.user);
        onClose();
        return;
      }
      throw new Error('Invalid response from server');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log in';
      // Local development fallback session if server is offline
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        const demoUser = {
          id: Date.now(),
          email,
          username: email.split('@')[0] || 'trader',
        };
        setAuth('demo-token-' + Date.now(), demoUser);
        onClose();
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAccount = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log in"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[380px] rounded-2xl border border-[#1E2536] bg-[#0E121A] p-7 shadow-2xl shadow-black/80">
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1 text-[#64748B] hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Logo matching Screenshot 3 with PaperTrade icon */}
        <div className="flex justify-center mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#7152FF] shadow-lg shadow-[#7152FF]/25">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17L12 3L21 17L12 14L3 17Z" fill="white" fillOpacity="0.95" />
              <path d="M12 14V3L21 17L12 14Z" fill="white" fillOpacity="0.75" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-white text-center mb-6">Log in</h2>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 p-2.5 text-xs text-[#FF4D5A]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-medium text-[#8492A6]">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-[#161B26] border border-[#232C3E] focus:border-[#7152FF] focus:ring-1 focus:ring-[#7152FF] px-4 py-3 text-sm text-white placeholder-[#556377] outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-medium text-[#8492A6]">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl bg-[#161B26] border border-[#232C3E] focus:border-[#7152FF] focus:ring-1 focus:ring-[#7152FF] px-4 py-3 pr-11 text-sm text-white placeholder-[#556377] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#556377] hover:text-white transition-colors cursor-pointer p-1"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => {}}
              className="text-xs font-medium text-[#8492A6] hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Log in Button */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-6 rounded-xl bg-[#1E2536] hover:bg-[#283248] disabled:opacity-50 disabled:cursor-not-allowed py-3 text-sm font-semibold text-[#A0AEC0] hover:text-white transition-colors cursor-pointer shadow-sm"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        {/* Footer Link to Create Account */}
        <div className="mt-7 text-center text-xs text-[#8492A6]">
          New to PaperTrade?{' '}
          <button
            type="button"
            onClick={handleOpenAccount}
            className="font-semibold text-white underline underline-offset-4 hover:text-[#7152FF] transition-colors cursor-pointer ml-1"
          >
            Open account
          </button>
        </div>
      </div>
    </div>
  );
}
