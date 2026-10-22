import { MarketFeed } from "./socket";

export * from "./socket";

if (import.meta.main) {
  const port = Number(process.env.WS_PORT) || 7070;
  new MarketFeed(port);
  console.log(`[WebSocket] Server running on ws://0.0.0.0:${port}`);
}
