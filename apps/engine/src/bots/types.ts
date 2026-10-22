import type { Market } from "../types/index";

export interface BotConfig {
  userId: string;
  market: Market;
  spreadBps: bigint;
  orderSize: bigint;
  levels: number;
}
