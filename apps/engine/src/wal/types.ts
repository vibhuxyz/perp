import type { Order, Market } from "../types/index";

export type EngineCommand =
  | {
      id: string;
      type: "DEPOSIT";
      idempotencyKey?: string;
      userId: string;
      amount: bigint;
      timestamp: number;
    }
  | {
      id: string;
      type: "WITHDRAW";
      idempotencyKey?: string;
      userId: string;
      amount: bigint;
      timestamp: number;
    }
  | {
      id: string;
      type: "PLACE_ORDER";
      idempotencyKey?: string;
      order: Order;
      timestamp: number;
    }
  | {
      id: string;
      type: "CANCEL_ORDER";
      idempotencyKey?: string;
      market: Market;
      userId: string;
      orderId: string;
      timestamp: number;
    };
