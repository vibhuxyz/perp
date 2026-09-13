import { useAccountStore } from "@/stores/account.store";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ShieldCheck, LogOut, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { token, user, setToken, clearToken } = useAccountStore();

  return (
    <div className="p-4 flex flex-col gap-4 max-w-lg">
      <div>
        <h1 className="text-base font-bold text-text-primary">Settings</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Manage your account and session preferences.
        </p>
      </div>

      {/* Account info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Email</span>
              <span className="text-text-primary font-medium">{user.email}</span>
            </div>
            {user.username && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Username</span>
                <span className="text-text-primary font-medium">{user.username}</span>
              </div>
            )}
            <Separator />
            <Button
              variant="destructive"
              size="sm"
              onClick={clearToken}
              className="w-full"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Developer token override */}
      <Card>
        <CardHeader>
          <CardTitle>Session token</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="jwt-token" className="text-xs font-medium text-text-secondary">
              JWT token (developer override)
            </label>
            <Input
              id="jwt-token"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="Paste a token to authenticate requests"
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-warning/5 border border-warning/20 p-3 text-xs text-warning">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Tokens are stored in localStorage for development. Production will use secure HttpOnly cookies.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="flex items-center gap-2 text-[11px] text-text-secondary/60">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>PaperTrade never asks for real wallet keys or deposits.</span>
      </div>
    </div>
  );
}
