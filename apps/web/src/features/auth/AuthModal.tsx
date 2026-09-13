import { useState } from "react";
import { config } from "@/app/config";
import { useAccountStore } from "@/stores/account.store";
import {
  LogIn,
  UserPlus,
  X,
  Loader2,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSignUp?: boolean;
}

export function AuthModal({ isOpen, onClose, defaultSignUp = false }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const setAuth = useAccountStore(s => s.setAuth);

  if (!isOpen) return null;

  function switchTab(signup: boolean) {
    setIsSignUp(signup);
    setError("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isSignUp
      ? `${config.apiUrl}/api/auth/signup`
      : `${config.apiUrl}/api/auth/signin`;

    const payload = isSignUp
      ? { email, password, username: username || undefined }
      : { email, password };

    try {
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.msg || data?.message || data?.errors || "Authentication failed");
      }
      if (data.token && data.user) {
        setAuth(data.token, data.user);
        onClose();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isSignUp ? "Create account" : "Sign in"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border-subtle bg-bg-card shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded p-1 text-text-secondary hover:text-text-primary transition-colors focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="h-5 w-5 text-brand" />
            <span className="font-bold text-brand text-sm tracking-tight">PaperTrade</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {isSignUp
              ? "Start practice trading with virtual money — no risk."
              : "Sign in to continue practice trading."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle">
          <button
            type="button"
            onClick={() => switchTab(false)}
            className={[
              "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              !isSignUp
                ? "text-text-primary border-b-2 border-brand"
                : "text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchTab(true)}
            className={[
              "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              isSignUp
                ? "text-text-primary border-b-2 border-brand"
                : "text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            <UserPlus className="h-4 w-4" />
            Create account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div role="alert" className="rounded-lg bg-loss/10 border border-loss/25 p-3 text-xs text-loss">
              {error}
            </div>
          )}

          <div className="grid gap-1.5">
            <label htmlFor="auth-email" className="text-xs font-medium text-text-secondary">
              Email address
            </label>
            <Input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="trader@example.com"
            />
          </div>

          {isSignUp && (
            <div className="grid gap-1.5">
              <label htmlFor="auth-username" className="text-xs font-medium text-text-secondary">
                Username <span className="text-text-secondary/60">(optional)</span>
              </label>
              <Input
                id="auth-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="cryptolearner"
              />
            </div>
          )}

          <div className="grid gap-1.5">
            <label htmlFor="auth-password" className="text-xs font-medium text-text-secondary">
              Password
            </label>
            <Input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {isSignUp && (
              <p className="text-[11px] text-text-secondary">Minimum 6 characters</p>
            )}
          </div>

          <Button
            type="submit"
            variant="brand"
            size="lg"
            disabled={loading}
            className="w-full mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isSignUp ? "Creating account…" : "Signing in…"}
              </>
            ) : (
              isSignUp ? "Create free account" : "Sign in"
            )}
          </Button>

          {/* Trust note */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-secondary/60">
            <ShieldCheck className="h-3 w-3" />
            <span>Virtual money only — no deposits, no real funds</span>
          </div>
        </form>
      </div>
    </div>
  );
}
