import { useState } from 'react';

export function SignupExtras({ agreed, onAgreedChange }: { agreed: boolean; onAgreedChange: (value: boolean) => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  return (
    <>
      <div className="flex items-center gap-3 pt-1">
        <input
          id="agree-terms"
          type="checkbox"
          checked={agreed}
          onChange={e => onAgreedChange(e.target.checked)}
          className="h-4 w-4 rounded border-[#20283A] bg-[#121622] text-[#7152FF] focus:ring-[#7152FF] cursor-pointer"
        />
        <label htmlFor="agree-terms" className="text-xs text-text-secondary cursor-pointer select-none">
          I agree to the{' '}
          <span className="text-white underline underline-offset-2 hover:text-[#7152FF]">Terms</span> &{' '}
          <span className="text-white underline underline-offset-2 hover:text-[#7152FF]">Privacy Policy</span>
        </label>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowInvite(!showInvite)}
          className="text-xs font-medium text-text-secondary hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
        >
          Have an invite code?
        </button>
        {showInvite && (
          <input
            type="text"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="Enter invite code"
            className="mt-2 w-full rounded-xl bg-[#121622] border border-[#20283A] px-4 py-2.5 text-xs text-white placeholder-text-muted outline-none"
          />
        )}
      </div>
    </>
  );
}
