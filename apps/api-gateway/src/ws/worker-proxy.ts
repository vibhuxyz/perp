import { request as httpRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import type { Server } from "http";
import type { Duplex } from "node:stream";

const writeBadGateway = (socket: Duplex, message: string): void => {
  if (!socket.writable) return;
  socket.end(
    `HTTP/1.1 502 Bad Gateway\r\nContent-Type: text/plain\r\nConnection: close\r\nContent-Length: ${Buffer.byteLength(message)}\r\n\r\n${message}`,
  );
};

const serializeHeaders = (headers: IncomingMessage["headers"]): string => {
  const headerLines: string[] = [];
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "undefined") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => headerLines.push(`${key}: ${item}\r\n`));
      continue;
    }
    headerLines.push(`${key}: ${value}\r\n`);
  }
  return headerLines.join("");
};

// Proxies WebSocket upgrade requests to the worker service. express-http-proxy
// (used for the other four upstream services) doesn't support protocol
// upgrades, so this speaks raw HTTP/1.1 to forward the handshake and then
// pipes the two sockets together directly.
export function attachWebSocketProxy(server: Server, targetWsUrl: URL): void {
  server.on("upgrade", (req, socket, head) => {
    const requestImpl =
      targetWsUrl.protocol === "https:" || targetWsUrl.protocol === "wss:"
        ? httpsRequest
        : httpRequest;
    const forwardedFor = [
      req.headers["x-forwarded-for"],
      req.socket.remoteAddress,
    ]
      .filter(Boolean)
      .join(", ");
    const isSecureSocket = Boolean(
      (req.socket as { encrypted?: boolean }).encrypted,
    );

    const proxyReq = requestImpl({
      protocol: targetWsUrl.protocol === "wss:" ? "https:" : "http:",
      hostname: targetWsUrl.hostname,
      port: targetWsUrl.port || (targetWsUrl.protocol === "wss:" ? 443 : 80),
      method: req.method || "GET",
      path: req.url || "/",
      headers: {
        ...req.headers,
        host: targetWsUrl.host,
        connection: "Upgrade",
        upgrade: req.headers.upgrade || "websocket",
        "x-forwarded-for": forwardedFor,
        "x-forwarded-host": req.headers.host,
        "x-forwarded-proto": isSecureSocket ? "wss" : "ws",
      },
    });

    proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
      const statusCode = proxyRes.statusCode || 101;
      const statusMessage = proxyRes.statusMessage || "Switching Protocols";
      socket.write(
        `HTTP/1.1 ${statusCode} ${statusMessage}\r\n${serializeHeaders(proxyRes.headers)}\r\n`,
      );
      if (proxyHead.length > 0) socket.write(proxyHead);
      if (head.length > 0) proxySocket.write(head);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
      proxySocket.on("error", (error) => {
        console.error("[Gateway] WebSocket upstream socket error:", error);
        socket.destroy(error);
      });
      socket.on("error", (error) => {
        console.error("[Gateway] Client WebSocket socket error:", error);
        proxySocket.destroy(error);
      });
    });

    proxyReq.on("response", (proxyRes) => {
      const statusCode = proxyRes.statusCode || 502;
      const statusMessage = proxyRes.statusMessage || "Bad Gateway";
      socket.write(
        `HTTP/1.1 ${statusCode} ${statusMessage}\r\n${serializeHeaders(proxyRes.headers)}\r\n`,
      );
      proxyRes.pipe(socket);
    });

    proxyReq.on("error", (error) => {
      console.error("[Gateway] WebSocket proxy request error:", error);
      writeBadGateway(socket, "Failed to connect to WebSocket upstream.");
    });

    proxyReq.end();
  });
}

export const attachWorkerWebSocketProxy = attachWebSocketProxy;

