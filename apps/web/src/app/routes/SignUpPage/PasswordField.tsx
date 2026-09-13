import { Eye, EyeOff } from 'lucide-react';
import type { AuthMode } from './authHelpers';

export function PasswordField({
  mode,
  password,
  onChange,
  showPassword,
  onToggleShow,
}: {
  mode: AuthMode;
  password: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="auth-password" className="block text-xs font-medium text-text-secondary">
        Password
      </label>
      <div className="relative flex items-center">
        <input
          id="auth-password"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={e => onChange(e.target.value)}
          placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
          className="w-full rounded-xl bg-[#121622] border border-[#20283A] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] px-4 py-3.5 pr-11 text-sm text-white placeholder-text-muted outline-none transition-all"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3.5 text-text-muted hover:text-white transition-colors cursor-pointer p-1"
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
