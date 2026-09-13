import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { PasswordField } from './PasswordField';
import { SignupExtras } from './SignupExtras';
import { SubmitButton } from './SubmitButton';
import { FooterToggle } from './FooterToggle';
import { useAuthForm } from './useAuthForm';
import type { AuthMode } from './authHelpers';

export function AuthForm({ initialMode }: { initialMode: AuthMode }) {
  const {
    mode,
    handleToggleMode,
    email,
    setEmail,
    password,
    setPassword,
    agreed,
    setAgreed,
    error,
    loading,
    handleSubmit,
  } = useAuthForm(initialMode);

  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === 'signup';
  const isDisabled = loading || !email || !password || (isSignup && !agreed);

  return (
    <div className="w-full max-w-md mx-auto lg:ml-auto">
      <h2 className="text-3xl font-bold text-white mb-8">{isSignup ? 'Open your account.' : 'Log in.'}</h2>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-loss/30 bg-loss/10 p-3 text-xs text-loss">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="auth-email" className="block text-xs font-medium text-text-secondary">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl bg-[#121622] border border-[#20283A] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] px-4 py-3.5 text-sm text-white placeholder-text-muted outline-none transition-all"
          />
        </div>

        <PasswordField
          mode={mode}
          password={password}
          onChange={setPassword}
          showPassword={showPassword}
          onToggleShow={() => setShowPassword(!showPassword)}
        />

        {!isSignup && (
          <div className="pt-0.5">
            <button
              type="button"
              className="text-xs font-medium text-text-secondary hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        )}

        {isSignup && <SignupExtras agreed={agreed} onAgreedChange={setAgreed} />}

        <SubmitButton mode={mode} loading={loading} disabled={isDisabled} />

        <FooterToggle mode={mode} onToggleMode={handleToggleMode} />
      </form>
    </div>
  );
}
