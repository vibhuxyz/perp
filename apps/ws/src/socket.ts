import { WebSocketServer, WebSocket } from "ws";
import { redisPubSub } from "@repo/shared";

type RedisClient = ReturnType<typeof redisPubSub>["pub"];

export interface MarketEvent {
  type: string;
  channel?: string;
  seq?: number;
  [key: string]: unknown;
}

const REDIS_CHANNEL = "market:feed";

export class MarketFeed {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket>;
  private subscriptions: Map<WebSocket, Set<string>>;
  private sequence: number;
  private pubClient: RedisClient | null = null;
  private subClient: RedisClient | null = null;

  constructor(port: number) {
    this.clients = new Set();
    this.subscriptions = new Map();
    this.sequence = 0;

    this.initWebSocketServer(port);
    this.initRedisPubSub();
  }

  private initWebSocketServer(port: number): void {
    try {
      this.wss = new WebSocketServer({ port });
      this.wss.on("error", (err: Error) => {
        if ("code" in err && (err as { code?: string }).code === "EADDRINUSE") {
          return;
        }
        if (err.message.includes("in use")) {
          return;
        }
        console.error(`[MarketFeed] WebSocket error on port ${port}:`, err.message);
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
          } catch (_err) {
            void _err;
          }
        });

        socket.on("close", () => {
          this.clients.delete(socket);
          this.subscriptions.delete(socket);
        });
      });
    } catch (_err) {
      void _err;
    }
  }

  private initRedisPubSub(): void {
    try {
      const { pub, sub } = redisPubSub();
      this.pubClient = pub;
      this.subClient = sub;
      this.subClient.subscribe(REDIS_CHANNEL).catch((_err: unknown) => void _err);
      this.subClient.on("message", (channel: string, message: string) => {
        if (channel !== REDIS_CHANNEL) {
          return;
        }
        try {
          const parsed = JSON.parse(message) as MarketEvent;
          this.dispatchToClients(parsed);
        } catch (_err) {
          void _err;
        }
      });
    } catch (_err) {
      void _err;
    }
  }

  public close(): void {
    try {
      this.subClient?.disconnect();
      this.pubClient?.disconnect();
    } catch (_err) {
      void _err;
    }

    for (const client of this.clients) {
      try {
        client.close();
      } catch (_err) {
        void _err;
      }
    }
    this.clients.clear();
    this.subscriptions.clear();

    try {
      this.wss?.close();
    } catch (_err) {
      void _err;
    }
  }

  public broadcast(event: MarketEvent): void {
    this.sequence++;
    const enrichedEvent: MarketEvent = {
      seq: this.sequence,
      ...event,
    };

    this.dispatchToClients(enrichedEvent);

    if (this.pubClient) {
      try {
        const payload = JSON.stringify(enrichedEvent, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        );
        this.pubClient.publish(REDIS_CHANNEL, payload).catch((_err: unknown) => void _err);
      } catch (_err) {
        void _err;
      }
    }
  }

  private dispatchToClients(event: MarketEvent): void {
    const payload = JSON.stringify(event, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );

    for (const client of this.clients) {
      if (client.readyState !== WebSocket.OPEN) {
        continue;
      }

      const clientSubs = this.subscriptions.get(client);
      const targetChannel = event.channel;

      if (!clientSubs || clientSubs.size === 0 || (targetChannel && clientSubs.has(targetChannel))) {
        client.send(payload);
      }
    }
  }
}
