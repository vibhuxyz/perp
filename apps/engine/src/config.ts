// Risk engine constants.
//
// Maintenance Margin Ratio (MMR): the minimum equity a position must keep,
// as a fraction of its notional value (indexPrice * quantity).
// If equity drops below this, the position is force-closed.
//
// Stored as an integer + scale because we do bigint math (no floats).
// ratio = MAINTENANCE_MARGIN_RATIO / MMR_SCALE
// e.g. 2n / 100n = 2% ; 50n / 10000n = 0.5%
export const MAINTENANCE_MARGIN_RATIO = 2n;
export const MMR_SCALE = 100n;
