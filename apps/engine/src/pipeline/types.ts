import type { EngineCommand } from "../wal/types";
import type { Fill, Order, Market, Side } from "../types/index";

export type EngineEventType =
  | "COLLATERAL_DEPOSITED"
  | "COLLATERAL_WITHDRAWN"
  | "ORDER_ACCEPTED"
  | "ORDER_REJECTED"
  | "ORDER_CANCELLED"
  | "FILL_CREATED"
  | "POSITION_LIQUIDATED"
  | "FUNDING_SETTLED";

export interface BaseEvent {
  eventSequence: bigint;
  commandId: string;
  timestamp: number;
}

export type EngineEvent =
  | (BaseEvent & {
      type: "COLLATERAL_DEPOSITED";
      userId: string;
      amount: bigint;
    })
  | (BaseEvent & {
      type: "COLLATERAL_WITHDRAWN";
      userId: string;
      amount: bigint;
    })
  | (BaseEvent & {
      type: "ORDER_ACCEPTED";
      order: Order;
    })
  | (BaseEvent & {
      type: "ORDER_REJECTED";
      orderId: string;
      userId: string;
      reason: string;
    })
  | (BaseEvent & {
      type: "ORDER_CANCELLED";
      orderId: string;
      userId: string;
      market: Market;
    })
  | (BaseEvent & {
      type: "FILL_CREATED";
      fill: Fill;
    })
  | (BaseEvent & {
      type: "POSITION_LIQUIDATED";
      userId: string;
      market: Market;
      side: Side;
      quantity: bigint;
    })
  | (BaseEvent & {
      type: "FUNDING_SETTLED";
      paymentId: string;
      userId: string;
      market: Market;
      amount: bigint;
    });

export interface SequencedCommand {
  sequenceNumber: string;
  command: EngineCommand;
  timestamp: number;
}

export interface CommandExecutionResult {
  sequenceNumber: bigint;
  success: boolean;
  deduplicated?: boolean;
  events: EngineEvent[];
}
