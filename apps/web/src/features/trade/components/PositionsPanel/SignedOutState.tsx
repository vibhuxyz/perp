export function SignedOutState({ onLogin, onSignUp }: { onLogin: () => void; onSignUp: () => void }) {
  return (
    <div className="flex h-48 items-center justify-center text-center p-6 bg-[#0B0E15]">
      <p className="text-sm font-medium text-white select-text">
        Please{' '}
        <button type="button" onClick={onLogin} className="text-[#7152FF] hover:underline font-semibold cursor-pointer">
          log in
        </button>{' '}
        or{' '}
        <button type="button" onClick={onSignUp} className="text-[#7152FF] hover:underline font-semibold cursor-pointer">
          sign up
        </button>{' '}
        first
      </p>
    </div>
  );
}
