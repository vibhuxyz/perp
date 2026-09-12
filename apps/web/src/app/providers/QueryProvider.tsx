import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Live market data never goes through Query — it arrives on the socket and lands in
// Zustand. Query owns REST state only, so a short stale time is enough.
const client = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
