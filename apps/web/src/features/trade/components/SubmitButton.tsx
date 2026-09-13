import { Button } from '@/components/ui/button';
import { useAccountStore } from '@/stores/account.store';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  isPending: boolean;
  side: 'LONG' | 'SHORT';
  onOpenAuth?: () => void;
}

/**
 * Context-aware submit button:
 *  - Signed out  → "Log in to trade"  (brand purple) — never green/red
 *  - Authenticated Long  → "Open Long (Demo)"   (green)
 *  - Authenticated Short → "Open Short (Demo)"  (red)
 *
 * This is non-negotiable per the PaperTrade design spec.
 */
export function SubmitButton({ isPending, side, onOpenAuth }: SubmitButtonProps) {
  const token          = useAccountStore(s => s.token);
  const isAuthenticated = Boolean(token);
  const isLong          = side === 'LONG';

  if (!isAuthenticated) {
    return (
      <Button
        type="button"
        variant="brand"
        size="lg"
        className="w-full"
        onClick={onOpenAuth}
      >
        Log in to trade
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      variant={isLong ? 'long' : 'short'}
      size="lg"
      disabled={isPending}
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Submitting…
        </>
      ) : (
        isLong ? 'Open Long (Demo)' : 'Open Short (Demo)'
      )}
    </Button>
  );
}
