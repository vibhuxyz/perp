import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useMarketFeed } from "@/features/trade/hooks/useMarketFeed";

export function AppShell() {
  // One socket for the whole app, opened above the routes so switching pages does
  // not tear it down and resubscribe.
  useMarketFeed();

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="min-h-0 flex-1 overflow-auto p-4">
          <Suspense fallback={<div className="text-text-secondary">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
