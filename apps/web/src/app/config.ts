
const defaultApiUrl = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? `${window.location.origin}/api`
  : "http://localhost:8080";

const defaultWsUrl = typeof window !== "undefined" && window.location.hostname !== "localhost"
  ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
  : "ws://localhost:8080";

export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? defaultApiUrl,
  wsUrl: import.meta.env.VITE_WS_URL ?? defaultWsUrl,
} as const;


export const MARKET = "BTC-PERP";
  