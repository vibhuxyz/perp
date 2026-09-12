import { useAccountStore } from "@/stores/account.store";

export default function SettingsPage() {
  const token = useAccountStore(s => s.token);
  const setToken = useAccountStore(s => s.setToken);

  return (
    <section className="grid max-w-xl gap-2 rounded border border-border-subtle bg-bg-card p-4">
      <h1 className="text-sm">Settings</h1>

      <label className="grid gap-1 text-sm">
        <span className="text-xs text-text-secondary">JWT token</span>
        <input
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="paste a token to authenticate requests"
          className="rounded bg-bg-elevated px-2 py-1.5 font-mono text-xs"
        />
      </label>

      <p className="text-xs text-text-secondary">
        Held in localStorage for now. Moves to an HttpOnly cookie at the BEST rung.
      </p>
    </section>
  );
}
