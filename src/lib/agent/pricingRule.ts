// Mintly Autonomous Pricing Rule
// Pure, deterministic function — no randomness, no side effects.
// A reviewer can predict the output from the inputs.
//
// Strategy: hyperbolic decay toward floor price, accelerated by competing supply.
// - Price decays faster when many competing listings exist (supply pressure)
// - Price decays faster as time since last update increases
// - Price never goes below floorPrice

/**
 * Compute the next price for a listing based on real elapsed time and supply signals.
 *
 * @param currentPrice   - Current listing price in UCT
 * @param floorPrice     - Minimum allowed price in UCT (set by seller, never crossed)
 * @param hoursSinceLastUpdate - Real hours since last_price_update_at
 * @param competingListingsCount - Real count of other 'listed' NFTs in the marketplace
 * @returns New price in UCT (floored at floorPrice, rounded to 4 decimal places)
 */
export function computeNextPrice(
  currentPrice: number,
  floorPrice: number,
  hoursSinceLastUpdate: number,
  competingListingsCount: number
): number {
  // If already at or below floor, no further decay
  if (currentPrice <= floorPrice) {
    return floorPrice;
  }

  const priceAboveFloor = currentPrice - floorPrice;

  // Base decay rate: 2% per hour (linear decay component)
  const BASE_DECAY_RATE_PER_HOUR = 0.02;

  // Supply multiplier: more competing listings → faster decay
  // Each additional competing listing adds 0.5% to the hourly decay rate
  // Capped at 5x the base rate so a flood of listings doesn't instantly crash prices
  const SUPPLY_BOOST_PER_LISTING = 0.005;
  const MAX_SUPPLY_MULTIPLIER = 5.0;
  const supplyMultiplier = Math.min(
    1.0 + competingListingsCount * SUPPLY_BOOST_PER_LISTING,
    MAX_SUPPLY_MULTIPLIER
  );

  // Effective hourly decay rate
  const effectiveRate = BASE_DECAY_RATE_PER_HOUR * supplyMultiplier;

  // Compound decay: price_above_floor * (1 - rate)^hours
  // This produces smooth, predictable price curves
  const decayFactor = Math.pow(1 - effectiveRate, hoursSinceLastUpdate);
  const newPriceAboveFloor = priceAboveFloor * decayFactor;

  const newPrice = floorPrice + newPriceAboveFloor;

  // Round to 4 decimal places to keep prices readable
  const rounded = Math.round(newPrice * 10_000) / 10_000;

  // Enforce floor
  return Math.max(rounded, floorPrice);
}

/**
 * Compute the new price after a real buyer purchase — demand pushes price up.
 * Pure, deterministic. Only applied to normal marketplace listings (not fixed-price resales).
 */
export function computeBumpedPrice(
  currentPrice: number,
  floorPrice: number,
  quantityBought: number
): number {
  const BUMP_PER_UNIT = 0.08; // 8% price increase per unit bought
  const MAX_PRICE_MULTIPLIER = 10.0; // hard cap relative to floor

  const bumped = currentPrice * (1 + BUMP_PER_UNIT * quantityBought);
  const cap = floorPrice * MAX_PRICE_MULTIPLIER;
  const rounded = Math.round(Math.min(bumped, cap) * 10_000) / 10_000;
  return Math.max(rounded, currentPrice);
}

/**
 * Compute the initial starting price for a new listing.
 * Starts at 3x the floor price (agent-determined premium), decaying over time.
 *
 * @param floorPriceUct - Seller-set floor price in UCT
 * @param competingListingsCount - Real count of other listed NFTs at creation time
 * @returns Initial listing price in UCT
 */
export function computeInitialPrice(
  floorPriceUct: number,
  competingListingsCount: number
): number {
  // Base premium: 3x floor price
  const BASE_PREMIUM_MULTIPLIER = 3.0;

  // Reduce premium when market is saturated — more competition → lower starting premium
  // Formula: premium shrinks by 5% per competing listing, down to 1.5x minimum
  const COMPETITION_DISCOUNT_PER_LISTING = 0.05;
  const MIN_PREMIUM_MULTIPLIER = 1.5;

  const premiumMultiplier = Math.max(
    BASE_PREMIUM_MULTIPLIER - competingListingsCount * COMPETITION_DISCOUNT_PER_LISTING,
    MIN_PREMIUM_MULTIPLIER
  );

  const initialPrice = floorPriceUct * premiumMultiplier;

  // Round to 4 decimal places
  return Math.round(initialPrice * 10_000) / 10_000;
}

/**
 * Determine whether a price change is significant enough to write to the database.
 * Avoids spamming price_history with sub-cent changes.
 */
export function isPriceChangeSignificant(
  oldPrice: number,
  newPrice: number,
  minChangeUct = 0.0001
): boolean {
  return Math.abs(oldPrice - newPrice) >= minChangeUct;
}
