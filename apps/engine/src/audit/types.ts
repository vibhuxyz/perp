export type AuditEventType =
  | "COLLATERAL_DEPOSITED"
  | "ORDER_PLACED"
  | "ORDER_CANCELLED"
  | "ORDER_FILLED"
  | "POSITION_LIQUIDATED"
  | "MARGIN_LOCKED"
  | "MARGIN_UNLOCKED";

export interface AuditRecord {
  sequenceNumber: bigint;
  timestamp: number;
  type: AuditEventType;
  userId: string;
  market?: string;
  payload: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

export interface AuditIntegrityReport {
  valid: boolean;
  totalRecords: number;
  corruptedAt?: bigint;
}
