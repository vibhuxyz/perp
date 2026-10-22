export interface ReconciliationReport {
  totalDeposited: bigint;
  totalAvailable: bigint;
  totalLocked: bigint;
  insuranceFund: bigint;
  feePool: bigint;
  totalPositionMargin: bigint;
  totalRestingMargin: bigint;
  isBalanced: boolean;
  drift: bigint;
}
