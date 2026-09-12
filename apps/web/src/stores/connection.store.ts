import { create } from "zustand";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface ConnectionState {
  status: ConnectionStatus;
  lastMessageAt: number | null;
  reconnectCount: number;
  setStatus: (status: ConnectionStatus) => void;
  messageReceived: () => void;
  reconnected: () => void;
}

export const useConnectionStore = create<ConnectionState>(set => ({
  status: "connecting",
  lastMessageAt: null,
  reconnectCount: 0,
  setStatus: status => set({ status }),
  messageReceived: () => set({ lastMessageAt: Date.now() }),
  reconnected: () => set(s => ({ reconnectCount: s.reconnectCount + 1 })),
}));
