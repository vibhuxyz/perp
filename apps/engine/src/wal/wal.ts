import fs from "fs";
import type { EngineCommand } from "./types";
import type { Exchange } from "../core/Exchange";

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

  public static replay(filePath: string, exchange: Exchange): number {
    if (!fs.existsSync(filePath)) {
      return 0;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    let count = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      try {
        const parsed = JSON.parse(trimmed, (_key, val) => {
          if (typeof val === "string" && /^-?\d+n$/.test(val)) {
            return BigInt(val.slice(0, -1));
          }
          return val;
        }) as EngineCommand;

        if (parsed.type === "DEPOSIT") {
          exchange.deposit(parsed.userId, parsed.amount);
          count++;
        } else if (parsed.type === "PLACE_ORDER") {
          parsed.order.createdAt = new Date(parsed.order.createdAt);
          exchange.placeOrder(parsed.order);
          count++;
        } else if (parsed.type === "CANCEL_ORDER") {
          exchange.cancelOrder(parsed.market, parsed.userId, parsed.orderId);
          count++;
        }
      } catch {
        break;
      }
    }

    return count;
  }
}
