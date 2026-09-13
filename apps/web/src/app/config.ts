// Vite only exposes VITE_-prefixed variables to the browser, so the web app cannot
// use @repo/env-config — that package reads process.env and is server-side only.
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  wsUrl: import.meta.env.VITE_WS_URL ?? "ws://localhost:8080",
} as const;

// One market exists on the engine today. When there are more, this moves into uiStore
// and the watchlist picks it.
export const MARKET = "BTC-PERP";
  