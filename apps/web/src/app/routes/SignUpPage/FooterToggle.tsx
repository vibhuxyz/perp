import type { AuthMode } from './authHelpers';

export function FooterToggle({ mode, onToggleMode }: { mode: AuthMode; onToggleMode: (mode: AuthMode) => void }) {
  if (mode === 'signup') {
    return (
      <div className="pt-4 text-center text-xs text-text-secondary">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onToggleMode('login')}
          className="font-semibold text-white underline underline-offset-4 hover:text-[#7152FF] transition-colors cursor-pointer ml-1"
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 text-center text-xs text-text-secondary">
      New to PaperTrade?{' '}
      <button
        type="button"
        onClick={() => onToggleMode('signup')}
        className="font-semibold text-white underline underline-offset-4 hover:text-[#7152FF] transition-colors cursor-pointer ml-1"
      >
        Open account
      </button>
    </div>
  );
}
