// Mintly Autonomous Agent — Run Cycle
// This is the core of the submission: the agent acts without human intervention.
//
// On every invocation:
// 1. Fetch all 'listed' NFTs from the DB
// 2. For each, compute real signals (time elapsed, competing supply)
// 3. Run pricingRule.ts — if price changed, update DB + write price_history + activity_feed
// 4. Fetch all 'pending' purchases
// 5. For each, check real Sphere SDK payment status on testnet2
// 6. Confirm or time-out purchases; update listings accordingly

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, count, ne, sql } from 'drizzle-orm';
import * as schema from '../../db/schema';
import {
  computeNextPrice,
  isPriceChangeSignificant,
  computeBumpedPrice,
} from './pricingRule';
import { checkTransferStatus } from '../sphere/payments';

// Agent uses direct Postgres connection (no Supabase client needed)
function getDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return drizzle(pool, { schema });
}

// How long (ms) before a pending purchase is timed out
const PURCHASE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function runCycle(): Promise<void> {
  console.log(`[agent] Cycle started at ${new Date().toISOString()}`);
  const db = getDb();

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Pricing: update all listed NFT prices
  // ─────────────────────────────────────────────────────────────────────────
  const listedNFTs = await db
    .select()
    .from(schema.listings)
    .where(eq(schema.listings.status, 'listed'));

  console.log(`[agent] Found ${listedNFTs.length} listed NFT(s)`);

  // Count total listed NFTs for the supply signal (real DB count)
  const [{ value: totalListed }] = await db
    .select({ value: count() })
    .from(schema.listings)
    .where(eq(schema.listings.status, 'listed'));

  for (const listing of listedNFTs) {
    if (listing.isFixedPrice) {
      console.log(`[agent] Listing ${listing.id}: fixed-price resale, skipping decay`);
      continue;
    }
    const currentPrice = Number(listing.currentPriceUct);
    const floorPrice = Number(listing.floorPriceUct);

    // Real elapsed time since last price update
    const lastUpdate = new Date(listing.lastPriceUpdateAt).getTime();
    const nowMs = Date.now();
    const hoursSinceLastUpdate = (nowMs - lastUpdate) / (1000 * 60 * 60);

    // Real competing supply: all OTHER listed NFTs
    const competingListingsCount = Math.max(0, Number(totalListed) - 1);

    const newPrice = computeNextPrice(
      currentPrice,
      floorPrice,
      hoursSinceLastUpdate,
      competingListingsCount
    );

    if (!isPriceChangeSignificant(currentPrice, newPrice)) {
      console.log(`[agent] Listing ${listing.id}: price unchanged (${currentPrice} UCT)`);
      continue;
    }

    console.log(
      `[agent] Listing ${listing.id}: price ${currentPrice} → ${newPrice} UCT ` +
      `(floor: ${floorPrice}, hours: ${hoursSinceLastUpdate.toFixed(2)}, ` +
      `competing: ${competingListingsCount})`
    );

    // Update listing's current_price_uct and last_price_update_at
    await db
      .update(schema.listings)
      .set({
        currentPriceUct: String(newPrice),
        lastPriceUpdateAt: new Date(),
      })
      .where(eq(schema.listings.id, listing.id));

    // Insert real price_history row
    await db.insert(schema.priceHistory).values({
      listingId: listing.id,
      priceUct: String(newPrice),
      changedBy: 'agent',
    });

    // Insert real activity_feed row
    const priceDiff = ((currentPrice - newPrice) / currentPrice * 100).toFixed(1);
    await db.insert(schema.activityFeed).values({
      listingId: listing.id,
      eventType: 'price_drop',
      message: `Agent dropped price for "${listing.title}" from ${currentPrice} UCT to ${newPrice} UCT (↓${priceDiff}%)`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Settlement: check all pending purchases on the real Sphere SDK
  // ─────────────────────────────────────────────────────────────────────────
  const pendingPurchases = await db
    .select()
    .from(schema.purchases)
    .where(eq(schema.purchases.status, 'pending'));

  console.log(`[agent] Found ${pendingPurchases.length} pending purchase(s)`);

  for (const purchase of pendingPurchases) {
    const ageMs = Date.now() - new Date(purchase.createdAt).getTime();

    if (!purchase.paymentRequestId) {
      // No payment request ID — can't check; time out if too old
      if (ageMs > PURCHASE_TIMEOUT_MS) {
        console.log(`[agent] Purchase ${purchase.id}: no payment ID, timing out`);
        await db
          .update(schema.purchases)
          .set({ status: 'failed' })
          .where(eq(schema.purchases.id, purchase.id));
      }
      continue;
    }

    // Check real Sphere payment status on testnet2
    const statusResult = await checkTransferStatus(purchase.paymentRequestId);

    if (statusResult.confirmed) {
      console.log(`[agent] Purchase ${purchase.id}: CONFIRMED — txId: ${statusResult.txId ?? 'n/a'}`);

      // Mark purchase confirmed with real tx_id from SDK
      await db
        .update(schema.purchases)
        .set({
          status: 'confirmed',
          txId: statusResult.txId ?? null,
          confirmedAt: new Date(),
        })
        .where(eq(schema.purchases.id, purchase.id));

     // Get the listing first to check supply
      const [listingBeforeUpdate] = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, purchase.listingId));

      const newSoldCount = (listingBeforeUpdate?.soldCount ?? 0) + (purchase.quantity ?? 1);
      const isSoldOut = newSoldCount >= (listingBeforeUpdate?.totalSupply ?? 1);
      const shouldBump = !isSoldOut && listingBeforeUpdate && !listingBeforeUpdate.isFixedPrice;
      const bumpedPrice = shouldBump
        ? computeBumpedPrice(Number(listingBeforeUpdate!.currentPriceUct), Number(listingBeforeUpdate!.floorPriceUct), purchase.quantity ?? 1)
        : Number(listingBeforeUpdate?.currentPriceUct ?? 0);

      // Increment soldCount; only flip status to 'sold' once supply is exhausted
      await db
        .update(schema.listings)
        .set({
          soldCount: newSoldCount,
          status: isSoldOut ? 'sold' : 'listed',
          ...(shouldBump ? { currentPriceUct: String(bumpedPrice), lastPriceUpdateAt: new Date() } : {}),
        })
        .where(eq(schema.listings.id, purchase.listingId));

      if (shouldBump) {
        await db.insert(schema.priceHistory).values({
          listingId: purchase.listingId,
          priceUct: String(bumpedPrice),
          changedBy: 'buyer_demand',
        });
      }

      const soldListing = listingBeforeUpdate;

      // Insert activity_feed row for the confirmed sale
     await db.insert(schema.activityFeed).values({
        listingId: purchase.listingId,
        eventType: 'sold',
        message:
          `"${soldListing?.title ?? 'NFT'}" sold to @${purchase.buyerNametag} ` +
          `for ${purchase.priceUct} UCT (${newSoldCount}/${listingBeforeUpdate?.totalSupply ?? 1} sold) ` +
          (statusResult.txId ? `(tx: ${statusResult.txId.slice(0, 16)}…)` : ''),
      });
    } else if (ageMs > PURCHASE_TIMEOUT_MS) {
      // Purchase timed out — mark failed, leave listing open for rebuy
      console.log(`[agent] Purchase ${purchase.id}: timed out after ${Math.round(ageMs / 60000)} min`);

      await db
        .update(schema.purchases)
        .set({ status: 'failed' })
        .where(eq(schema.purchases.id, purchase.id));

      await db.insert(schema.activityFeed).values({
        listingId: purchase.listingId,
        eventType: 'purchase_failed',
        message: `Purchase of listing ${purchase.listingId} by @${purchase.buyerNametag} timed out — listing remains open`,
      });
    } else {
      console.log(
        `[agent] Purchase ${purchase.id}: still pending ` +
        `(${Math.round(ageMs / 60000)} min old)`
      );
    }
  }

  console.log(`[agent] Cycle complete at ${new Date().toISOString()}`);
}

// Export for direct use without default export ambiguity
export default runCycle;
