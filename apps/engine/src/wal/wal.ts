import fs from "fs";
import type { EngineCommand } from "./types";
import type { Exchange } from "../core/Exchange";

function parseWalLine(line: string): EngineCommand {
  return JSON.parse(line, (_key, val) => {
    if (typeof val === "string" && /^-?\d+n$/.test(val)) {
      return BigInt(val.slice(0, -1));
    }
    return val;
  }) as EngineCommand;
}

function applyReplayCommand(cmd: EngineCommand, exchange: Exchange): void {
  if (cmd.idempotencyKey) {
    exchange.appliedKeys.add(cmd.idempotencyKey);
  }

  if (cmd.type === "DEPOSIT") {
    exchange.deposit(cmd.userId, cmd.amount);
  } else if (cmd.type === "WITHDRAW") {
    exchange.withdraw(cmd.userId, cmd.amount);
  } else if (cmd.type === "PLACE_ORDER") {
    cmd.order.createdAt = new Date(cmd.order.createdAt);
    exchange.placeOrder(cmd.order);
  } else if (cmd.type === "CANCEL_ORDER") {
    exchange.cancelOrder(cmd.market, cmd.userId, cmd.orderId);
  }
}

export class WriteAheadLog {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public append(command: EngineCommand): void {
    const payload = JSON.stringify(command, (_key, val) =>
      typeof val === "bigint" ? `${val.toString()}n` : val,
    );
    fs.appendFileSync(this.filePath, `${payload}\n`);
  }

  public static replay(filePath: string, exchange: Exchange, startFromIndex = 0): number {
    if (!fs.existsSync(filePath)) {
      return 0;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    let count = 0;
    let index = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      if (index < startFromIndex) {
        index++;
        continue;
      }

      try {
        const parsed = parseWalLine(trimmed);
        applyReplayCommand(parsed, exchange);
        count++;
        index++;
      } catch {
        break;
      }
    }

    return count;
  }
}
