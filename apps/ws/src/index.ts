import { MarketFeed, type MarketEvent } from "./socket";

export { MarketFeed, type MarketEvent };

if (import.meta.main) {
  const port = Number(process.env.WS_PORT) || 7071;
  new MarketFeed(port);
  console.log(`[WebSocket] Server running on ws://0.0.0.0:${port}`);
}
