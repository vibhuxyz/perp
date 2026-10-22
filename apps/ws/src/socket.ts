import { WebSocketServer, WebSocket } from "ws";

export interface MarketEvent {
  type: string;
  channel?: string;
  seq?: number;
  [key: string]: unknown;
}

export class MarketFeed {
  private wss: WebSocketServer;
  private clients: Set<WebSocket>;
  private subscriptions: Map<WebSocket, Set<string>>;
  private sequence: number;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.clients = new Set();
    this.subscriptions = new Map();
    this.sequence = 0;

    this.wss.on("error", (err: Error) => {
      console.error(`[MarketFeed] WebSocket server error on port ${port}:`, err.message);
    });

    this.wss.on("connection", socket => {
      this.clients.add(socket);
      this.subscriptions.set(socket, new Set());

      socket.on("message", data => {
        try {
          const msg = JSON.parse(data.toString()) as { action?: string; channel?: string };
          const subs = this.subscriptions.get(socket);
          if (msg.action === "subscribe" && msg.channel && subs) {
            subs.add(msg.channel);
          } else if (msg.action === "unsubscribe" && msg.channel && subs) {
            subs.delete(msg.channel);
          }
        } catch {
          // invalid json, ignore
        }
      });

      socket.on("close", () => {
        this.clients.delete(socket);
        this.subscriptions.delete(socket);
      });
    });
  }

  public close(): void {
    for (const client of this.clients) {
      try {
        client.close();
      } catch {
        // already closed
      }
    }
    this.clients.clear();
    this.subscriptions.clear();
    this.wss.close();
  }

  public broadcast(event: MarketEvent): void {
    this.sequence++;
    const enrichedEvent: MarketEvent = {
      seq: this.sequence,
      ...event,
    };

    const payload = JSON.stringify(enrichedEvent, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );

    for (const client of this.clients) {
      if (client.readyState !== WebSocket.OPEN) {
        continue;
      }

      const clientSubs = this.subscriptions.get(client);
      const targetChannel = enrichedEvent.channel;

      if (!clientSubs || clientSubs.size === 0 || (targetChannel && clientSubs.has(targetChannel))) {
        client.send(payload);
      }
    }
  }
}
