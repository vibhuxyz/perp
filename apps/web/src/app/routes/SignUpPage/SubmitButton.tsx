import type { AuthMode } from './authHelpers';

function buttonLabel(loading: boolean, mode: AuthMode): string {
  if (loading) return mode === 'signup' ? 'Creating account…' : 'Logging in…';
  return mode === 'signup' ? 'Open account' : 'Log in';
}

export function SubmitButton({
  mode,
  loading,
  disabled,
}: {
  mode: AuthMode;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-6 w-full rounded-xl bg-[#1E2536] hover:bg-[#283248] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-semibold text-[#A0AEC0] hover:text-white transition-colors cursor-pointer shadow-sm"
    >
      {buttonLabel(loading, mode)}
    </button>
  );
}
