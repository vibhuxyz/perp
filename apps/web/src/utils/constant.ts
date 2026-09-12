const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:6000"

export const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:7000"

export const MARKET = "BTC-PERP"

export const API_ROUTES = {
  SIGN_UP: `${API_URL}/api/auth/signup`,
  SIGN_IN: `${API_URL}/api/auth/signin`,
  GET_USER: `${API_URL}/api/auth/me`,
  DEPOSIT: `${API_URL}/api/wallet/onramp`,
  ORDER: `${API_URL}/api/order`,
  DEPTH: `${API_URL}/api/depth`,
  POSITIONS: `${API_URL}/api/positions`,
  EQUITY: `${API_URL}/api/equity`,
}

export const APP_ROUTES = {
  SIGN_UP: "/signup",
  SIGN_IN: "/signin",
  DASHBOARD: "/dashboard",
}
