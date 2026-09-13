import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TopNav } from './TopNav';
import { LeftSidebar } from './LeftSidebar';
import { StatsBar } from './StatsBar';
import { StatusBar } from './StatusBar';
import { useMarketFeed } from '@/features/trade/hooks/useMarketFeed';
import { Skeleton } from '@/components/ui/skeleton';

function PageSkeleton() {
  return (
    <div className="flex-1 p-3 flex flex-col gap-3">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex-1 grid grid-cols-3 gap-3">
        <Skeleton className="h-full rounded-xl col-span-2" />
        <Skeleton className="h-full rounded-xl" />
      </div>
    </div>
  );
}

export function AppShell() {
  // Single market WebSocket connection opened at top of app
  useMarketFeed();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0A0D14] text-[#F4F7FB]">
      {/* Top Header */}
      <TopNav />

      {/* Main Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Vertical Navigation Sidebar */}
        <LeftSidebar />

        {/* Right Trading View with Top Stats Bar */}
        <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
          <StatsBar />
          <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden bg-[#0A0D14]">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
