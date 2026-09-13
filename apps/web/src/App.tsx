import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/app/layout/AppShell";
import { QueryProvider } from "@/app/providers/QueryProvider";

const TradePage       = lazy(() => import("@/app/routes/TradePage"));
const PositionsPage   = lazy(() => import("@/app/routes/PositionsPage"));
const HistoryPage     = lazy(() => import("@/app/routes/HistoryPage"));
const LearnPage       = lazy(() => import("@/app/routes/LearnPage"));
const DepositPage     = lazy(() => import("@/app/routes/DepositPage"));
const SettingsPage    = lazy(() => import("@/app/routes/SettingsPage"));
const PlaceholderView = lazy(() => import("@/app/routes/PlaceholderView"));
const SignUpPage      = lazy(() => import("@/app/routes/SignUpPage"));

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          {/* Standalone Authentication Pages */}
          <Route path="register" element={<SignUpPage defaultMode="signup" />} />
          <Route path="signup" element={<SignUpPage defaultMode="signup" />} />
          <Route path="login" element={<SignUpPage defaultMode="login" />} />

          <Route element={<AppShell />}>
            <Route index element={<TradePage />} />
            <Route path="positions" element={<PositionsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="deposit" element={<DepositPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* TopNav and Sidebar auxiliary routes */}
            <Route
              path="markets"
              element={<PlaceholderView title="Markets Overview" description="Explore all supported perpetual contracts and spot indexes." />}
            />
            <Route
              path="leaderboard"
              element={<PlaceholderView title="Trader Leaderboard" description="See top-performing practice traders by ROE and win rate." />}
            />
            <Route
              path="challenges"
              element={<PlaceholderView title="Trading Challenges" description="Participate in weekly simulation challenges to test your strategy." />}
            />
            <Route
              path="simulations"
              element={<PlaceholderView title="Market Simulations" description="Simulate historical black-swan events and market volatility." />}
            />
            <Route
              path="tutorials"
              element={<PlaceholderView title="Interactive Tutorials" description="Step-by-step walkthroughs of order routing and leverage mechanics." />}
            />
            <Route
              path="strategy"
              element={<PlaceholderView title="Strategy Lab" description="Backtest indicators and test trading rules with simulated order fills." />}
            />
            <Route
              path="news"
              element={<PlaceholderView title="Market News & Sentiment" description="Real-time crypto headlines and macro economic calendar." />}
            />
            <Route
              path="achievements"
              element={<PlaceholderView title="Trader Achievements" description="Unlock badges as you master risk management and complete courses." />}
            />

            {/* Fallback to TradePage */}
            <Route path="*" element={<TradePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryProvider>
  );
}
