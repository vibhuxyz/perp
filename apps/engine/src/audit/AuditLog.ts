import { createHash } from "node:crypto";
import type { AuditEventType, AuditRecord, AuditIntegrityReport } from "./types";

export class AuditLog {
  private records: AuditRecord[];
  private nextSequence: bigint;
  private lastHash: string;

  constructor() {
    this.records = [];
    this.nextSequence = 1n;
    this.lastHash = "0".repeat(64);
  }

  private computeHash(
    seq: bigint,
    timestamp: number,
    type: AuditEventType,
    userId: string,
    market: string | undefined,
    payload: Record<string, unknown>,
    prevHash: string,
  ): string {
    const raw = `${seq}:${timestamp}:${type}:${userId}:${market ?? ""}:${JSON.stringify(payload)}:${prevHash}`;
    return createHash("sha256").update(raw).digest("hex");
  }

  public record(
    type: AuditEventType,
    userId: string,
    payload: Record<string, unknown>,
    market?: string,
  ): AuditRecord {
    const sequenceNumber = this.nextSequence;
    this.nextSequence += 1n;
    const timestamp = Date.now();
    const previousHash = this.lastHash;

    const hash = this.computeHash(
      sequenceNumber,
      timestamp,
      type,
      userId,
      market,
      payload,
      previousHash,
    );

    const auditRecord: AuditRecord = {
      sequenceNumber,
      timestamp,
      type,
      userId,
      market,
      payload,
      previousHash,
      hash,
    };

    this.records.push(auditRecord);
    this.lastHash = hash;

    return auditRecord;
  }

  public getRecords(userId?: string): AuditRecord[] {
    if (!userId) {
      return [...this.records];
    }
    return this.records.filter(r => r.userId === userId);
  }

  public getRecordCount(): number {
    return this.records.length;
  }

  public verifyIntegrity(): AuditIntegrityReport {
    let expectedPrevHash = "0".repeat(64);

    for (let i = 0; i < this.records.length; i++) {
      const record = this.records[i];
      if (!record) {
        return { valid: false, totalRecords: this.records.length, corruptedAt: BigInt(i) };
      }

      if (record.previousHash !== expectedPrevHash) {
        return { valid: false, totalRecords: this.records.length, corruptedAt: record.sequenceNumber };
      }

      const calculated = this.computeHash(
        record.sequenceNumber,
        record.timestamp,
        record.type,
        record.userId,
        record.market,
        record.payload,
        record.previousHash,
      );

      if (calculated !== record.hash) {
        return { valid: false, totalRecords: this.records.length, corruptedAt: record.sequenceNumber };
      }

      expectedPrevHash = record.hash;
    }

    return { valid: true, totalRecords: this.records.length };
  }
}
