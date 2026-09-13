import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, Percent, Scale, Sun, AlertCircle } from 'lucide-react';
import { config } from '@/app/config';
import { useAccountStore } from '@/stores/account.store';

interface SignUpPageProps {
  defaultMode?: 'signup' | 'login';
}

export default function SignUpPage({ defaultMode = 'signup' }: SignUpPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as 'signup' | 'login') || defaultMode;

  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAccountStore((s) => s.setAuth);

  const handleToggleMode = (newMode: 'signup' | 'login') => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !agreed) {
      setError('Please agree to the Terms & Privacy Policy to continue');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    const endpoint = mode === 'signup'
      ? `${config.apiUrl}/api/auth/signup`
      : `${config.apiUrl}/api/auth/signin`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.msg || data?.message || data?.errors || `${mode === 'signup' ? 'Registration' : 'Login'} failed`);
      }

      if (data.token && data.user) {
        setAuth(data.token, data.user);
        navigate('/');
        return;
      }
      throw new Error('Invalid response from server');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      // Local development fallback session if server is offline
      if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        const demoUser = {
          id: Date.now(),
          email,
          username: email.split('@')[0] || 'trader',
        };
        setAuth('demo-token-' + Date.now(), demoUser);
        navigate('/');
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0D14] text-[#F4F7FB] flex flex-col selection:bg-[#7152FF]/30 selection:text-white">
      {/* Top Header */}
      <header className="flex h-16 w-full items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#7152FF] shadow-md shadow-[#7152FF]/20 group-hover:scale-105 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17L12 3L21 17L12 14L3 17Z" fill="white" fillOpacity="0.95" />
              <path d="M12 14V3L21 17L12 14Z" fill="white" fillOpacity="0.75" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">PaperTrade</span>
        </Link>

        <button
          type="button"
          title="Toggle theme"
          className="p-2 rounded-xl text-[#8492A6] hover:text-white hover:bg-[#131824] transition-colors cursor-pointer"
        >
          <Sun className="h-4 w-4" />
        </button>
      </header>

      {/* Main Two-Column Container */}
      <main className="flex-1 flex items-center justify-center px-6 lg:px-12 py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Left Column: Hero & Value Propositions */}
          <div className="flex flex-col justify-between py-6">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-white leading-[1.12] mb-12">
                Every market.
                <br />
                One account.
              </h1>

              <div className="space-y-7">
                {/* Feature 1 */}
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141924] border border-[#202738] text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5v4" />
                      <rect width="4" height="6" x="7" y="9" rx="1" />
                      <path d="M9 15v4" />
                      <path d="M17 3v2" />
                      <rect width="4" height="8" x="15" y="5" rx="1" />
                      <path d="M17 13v8" />
                    </svg>
                  </div>
                  <span className="text-base font-semibold text-white">Crypto spot and perps</span>
                </div>

                {/* Feature 2 */}
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141924] border border-[#202738] text-white">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-base font-semibold text-white">Thousands of real US stocks</span>
                </div>

                {/* Feature 3 */}
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141924] border border-[#202738] text-white">
                    <Percent className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-base font-semibold text-white">Yield on your assets</span>
                </div>
              </div>
            </div>

            {/* Bottom Proof of Reserves Link */}
            <div className="pt-16 lg:pt-24">
              <button
                type="button"
                className="flex items-center gap-2 text-xs text-[#8492A6] hover:text-white transition-colors cursor-pointer"
              >
                <Scale className="h-4 w-4" />
                <span>Daily proof of reserves ↗</span>
              </button>
            </div>
          </div>

          {/* Right Column: Form (Toggles between Open your account and Log in) */}
          <div className="w-full max-w-md mx-auto lg:ml-auto">
            <h2 className="text-3xl font-bold text-white mb-8">
              {mode === 'signup' ? 'Open your account.' : 'Log in.'}
            </h2>

            {error && (
              <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-[#FF4D5A]/30 bg-[#FF4D5A]/10 p-3 text-xs text-[#FF4D5A]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="block text-xs font-medium text-[#8492A6]">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-[#121622] border border-[#20283A] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] px-4 py-3.5 text-sm text-white placeholder-[#556377] outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="auth-password" className="block text-xs font-medium text-[#8492A6]">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                    className="w-full rounded-xl bg-[#121622] border border-[#20283A] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] px-4 py-3.5 pr-11 text-sm text-white placeholder-[#556377] outline-none transition-all"
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

              {/* In Login Mode: Forgot Password */}
              {mode === 'login' && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="text-xs font-medium text-[#8492A6] hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* In Signup Mode: Terms Checkbox and Invite Code */}
              {mode === 'signup' && (
                <>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      id="agree-terms"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="h-4 w-4 rounded border-[#20283A] bg-[#121622] text-[#7152FF] focus:ring-[#7152FF] cursor-pointer"
                    />
                    <label htmlFor="agree-terms" className="text-xs text-[#8492A6] cursor-pointer select-none">
                      I agree to the{' '}
                      <span className="text-white underline underline-offset-2 hover:text-[#7152FF]">Terms</span> &{' '}
                      <span className="text-white underline underline-offset-2 hover:text-[#7152FF]">Privacy Policy</span>
                    </label>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInvite(!showInvite)}
                      className="text-xs font-medium text-[#8492A6] hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Have an invite code?
                    </button>
                    {showInvite && (
                      <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Enter invite code"
                        className="mt-2 w-full rounded-xl bg-[#121622] border border-[#20283A] px-4 py-2.5 text-xs text-white placeholder-[#556377] outline-none"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || !password || (mode === 'signup' && !agreed)}
                className="mt-6 w-full rounded-xl bg-[#1E2536] hover:bg-[#283248] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-semibold text-[#A0AEC0] hover:text-white transition-colors cursor-pointer shadow-sm"
              >
                {loading
                  ? mode === 'signup'
                    ? 'Creating account…'
                    : 'Logging in…'
                  : mode === 'signup'
                  ? 'Open account'
                  : 'Log in'}
              </button>

              {/* Footer Toggle Link */}
              <div className="pt-4 text-center text-xs text-[#8492A6]">
                {mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleToggleMode('login')}
                      className="font-semibold text-white underline underline-offset-4 hover:text-[#7152FF] transition-colors cursor-pointer ml-1"
                    >
                      Log in
                    </button>
                  </>
                ) : (
                  <>
                    New to PaperTrade?{' '}
                    <button
                      type="button"
                      onClick={() => handleToggleMode('signup')}
                      className="font-semibold text-white underline underline-offset-4 hover:text-[#7152FF] transition-colors cursor-pointer ml-1"
                    >
                      Open account
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
