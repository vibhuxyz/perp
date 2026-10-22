export const TAKER_FEE_BPS = 5n;
export const MAKER_FEE_BPS = 2n;
export const BPS_SCALE = 10_000n;

export function calculateFee(notional: bigint, bps: bigint): bigint {
  return (notional * bps) / BPS_SCALE;
}
