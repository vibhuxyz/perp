import fs from "node:fs";
import type { Exchange } from "../core/Exchange";
import type { EngineCommand } from "../wal/types";
import type {
  EngineEvent,
  SequencedCommand,
  CommandExecutionResult,
} from "./types";

function serializePayload(data: unknown): string {
  return JSON.stringify(data, (_key, val) =>
    typeof val === "bigint" ? `${val.toString()}n` : val,
  );
}

function parsePayload<T>(text: string): T {
  return JSON.parse(text, (_key, val) => {
    if (typeof val === "string" && /^-?\d+n$/.test(val)) {
      return BigInt(val.slice(0, -1));
    }
    return val;
  }) as T;
}

export class DurablePipeline {
  public exchange: Exchange;
  private walFd: number;
  private filePath: string;
  private nextSequenceNumber: bigint;
  private nextEventSequence: bigint;
  public publishedEvents: EngineEvent[];

  constructor(filePath: string, exchange: Exchange, startSeq = 1n) {
    this.filePath = filePath;
    this.exchange = exchange;
    this.walFd = fs.openSync(filePath, "a+");
    this.nextSequenceNumber = startSeq;
    this.nextEventSequence = 1n;
    this.publishedEvents = [];
  }

  public getNextSequence(): bigint {
    return this.nextSequenceNumber;
  }

  public execute(command: EngineCommand): CommandExecutionResult {
    if (command.idempotencyKey && this.exchange.appliedKeys.has(command.idempotencyKey)) {
      return {
        sequenceNumber: 0n,
        success: true,
        deduplicated: true,
        events: [],
      };
    }

    const seq = this.nextSequenceNumber;
    this.nextSequenceNumber += 1n;

    const record: SequencedCommand = {
      sequenceNumber: seq.toString(),
      command,
      timestamp: Date.now(),
    };

    const payload = `${serializePayload(record)}\n`;
    fs.writeSync(this.walFd, Buffer.from(payload));
    fs.fsyncSync(this.walFd);

    const events = this.mutateState(command, seq);

    if (command.idempotencyKey) {
      this.exchange.appliedKeys.add(command.idempotencyKey);
    }

    for (const evt of events) {
      this.publishedEvents.push(evt);
    }

    return {
      sequenceNumber: seq,
      success: true,
      events,
    };
  }

  private mutateState(command: EngineCommand, _seq: bigint): EngineEvent[] {
    const events: EngineEvent[] = [];
    const t = Date.now();

    if (command.type === "DEPOSIT") {
      this.exchange.deposit(command.userId, command.amount);
      events.push({
        eventSequence: this.nextEventSequence++,
        commandId: command.id,
        timestamp: t,
        type: "COLLATERAL_DEPOSITED",
        userId: command.userId,
        amount: command.amount,
      });
    } else if (command.type === "WITHDRAW") {
      const ok = this.exchange.withdraw(command.userId, command.amount);
      if (ok) {
        events.push({
          eventSequence: this.nextEventSequence++,
          commandId: command.id,
          timestamp: t,
          type: "COLLATERAL_WITHDRAWN",
          userId: command.userId,
          amount: command.amount,
        });
      }
    } else if (command.type === "PLACE_ORDER") {
      const fills = this.exchange.placeOrder(command.order);
      if (command.order.status === "rejected") {
        events.push({
          eventSequence: this.nextEventSequence++,
          commandId: command.id,
          timestamp: t,
          type: "ORDER_REJECTED",
          orderId: command.order.orderId,
          userId: command.order.userId,
          reason: "Risk check failed",
        });
      } else {
        events.push({
          eventSequence: this.nextEventSequence++,
          commandId: command.id,
          timestamp: t,
          type: "ORDER_ACCEPTED",
          order: command.order,
        });
        for (const fill of fills) {
          events.push({
            eventSequence: this.nextEventSequence++,
            commandId: command.id,
            timestamp: t,
            type: "FILL_CREATED",
            fill,
          });
        }
      }
    } else if (command.type === "CANCEL_ORDER") {
      const cancelled = this.exchange.cancelOrder(command.market, command.userId, command.orderId);
      if (cancelled) {
        events.push({
          eventSequence: this.nextEventSequence++,
          commandId: command.id,
          timestamp: t,
          type: "ORDER_CANCELLED",
          orderId: command.orderId,
          userId: command.userId,
          market: command.market,
        });
      }
    }

    return events;
  }

  public static replay(filePath: string, targetExchange: Exchange): number {
    if (!fs.existsSync(filePath)) {
      return 0;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    let count = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const record = parsePayload<SequencedCommand>(trimmed);
        const cmd = record.command;

        if (cmd.idempotencyKey) {
          targetExchange.appliedKeys.add(cmd.idempotencyKey);
        }

        if (cmd.type === "DEPOSIT") {
          targetExchange.deposit(cmd.userId, cmd.amount);
        } else if (cmd.type === "WITHDRAW") {
          targetExchange.withdraw(cmd.userId, cmd.amount);
        } else if (cmd.type === "PLACE_ORDER") {
          cmd.order.createdAt = new Date(cmd.order.createdAt);
          targetExchange.placeOrder(cmd.order);
        } else if (cmd.type === "CANCEL_ORDER") {
          targetExchange.cancelOrder(cmd.market, cmd.userId, cmd.orderId);
        }
        count++;
      } catch {
        break;
      }
    }

    return count;
  }

  public close(): void {
    fs.closeSync(this.walFd);
  }
}
