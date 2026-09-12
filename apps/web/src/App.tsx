import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/layout/AppShell";
import { QueryProvider } from "@/app/providers/QueryProvider";

const TradePage = lazy(() => import("@/app/routes/TradePage"));
const PositionsPage = lazy(() => import("@/app/routes/PositionsPage"));
const HistoryPage = lazy(() => import("@/app/routes/HistoryPage"));
const DepositPage = lazy(() => import("@/app/routes/DepositPage"));
const SettingsPage = lazy(() => import("@/app/routes/SettingsPage"));

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TradePage />} />
            <Route path="positions" element={<PositionsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="deposit" element={<DepositPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}
