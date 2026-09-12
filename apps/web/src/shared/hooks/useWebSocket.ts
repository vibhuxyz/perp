import { useEffect, useRef } from "react";
import { useConnectionStore } from "@/stores/connection.store";

const HEARTBEAT_MS = 30_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Owns the socket lifecycle so no component has to. Reconnects with exponential
 * backoff and reports state into connectionStore, which is what the status
 * indicator reads.
 */
export function useWebSocket(url: string, onMessage: (data: unknown) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const { setStatus, messageReceived, reconnected } = useConnectionStore.getState();

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let heartbeat: ReturnType<typeof setInterval>;
    let attempts = 0;
    let closed = false;

    const connect = () => {
      setStatus(attempts === 0 ? "connecting" : "reconnecting");
      socket = new WebSocket(url);

      socket.onopen = () => {
        attempts = 0;
        setStatus("connected");
        heartbeat = setInterval(() => socket?.send(JSON.stringify({ type: "ping" })), HEARTBEAT_MS);
      };

      socket.onmessage = event => {
        messageReceived();
        onMessageRef.current(JSON.parse(event.data));
      };

      socket.onclose = () => {
        clearInterval(heartbeat);

        if (closed) return;

        setStatus("disconnected");
        reconnected();
        reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** attempts++, MAX_BACKOFF_MS));
      };

      socket.onerror = () => socket?.close();
    };

    connect();

    return () => {
      closed = true;
      clearTimeout(reconnectTimer);
      clearInterval(heartbeat);
      socket?.close();
    };
  }, [url]);
}
