import { WebSocketServer, WebSocket } from "ws";

export interface MarketEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * Broadcasts every engine event to every connected client. No channels, no auth, no
 * backpressure handling — a client either sees the whole firehose or nothing.
 */
export class MarketFeed {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.clients = new Set();

    this.wss.on("error", (err: any) => {
      console.error(`[MarketFeed] WebSocket server error on port ${port}:`, err?.message || err);
    });

    this.wss.on("connection", socket => {
      this.clients.add(socket);
      socket.on("close", () => this.clients.delete(socket));
    });
  }

  public close(): void {
    for (const client of this.clients) {
      try {
        client.close();
      } catch {}
    }
    this.clients.clear();
    this.wss.close();
  }

  public broadcast(event: MarketEvent): void {
    // bigint has no JSON representation, so money and size cross the wire as strings.
    const payload = JSON.stringify(event, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}
