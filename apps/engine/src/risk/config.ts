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

// Funding damping factor. A raw premium payment (markPrice - indexPrice) per unit is far
// too violent to charge on every interval, so we take a fraction of it.
// factor = FUNDING_FACTOR / FUNDING_SCALE, e.g. 1n / 100n = 1% of the premium.
export const FUNDING_FACTOR = 1n;
export const FUNDING_SCALE = 100n;

// How often funding settles. Real venues use 8h; we run it fast so it is observable.
export const FUNDING_INTERVAL_MS = 10_000;
