import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, listings, activityFeed, priceHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { computeBumpedPrice } from '@/lib/agent/pricingRule';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      purchaseId: string;
      paymentRequestId: string;
    };

    const { purchaseId, paymentRequestId } = body;

    if (!purchaseId || !paymentRequestId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId));
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Real transfer already confirmed in wallet history client-side — mark confirmed now
    await db
      .update(purchases)
      .set({ paymentRequestId, status: 'confirmed', txId: paymentRequestId, confirmedAt: new Date() })
      .where(eq(purchases.id, purchaseId));

   const [listing] = await db.select().from(listings).where(eq(listings.id, purchase.listingId));
    if (listing) {
      const newSoldCount = listing.soldCount + (purchase.quantity ?? 1);
      const isSoldOut = newSoldCount >= listing.totalSupply;
      const shouldBump = !isSoldOut && !listing.isFixedPrice;
      const bumpedPrice = shouldBump
        ? computeBumpedPrice(Number(listing.currentPriceUct), Number(listing.floorPriceUct), purchase.quantity ?? 1)
        : Number(listing.currentPriceUct);

      await db
        .update(listings)
        .set({
          soldCount: newSoldCount,
          status: isSoldOut ? 'sold' : 'listed',
          ...(shouldBump ? { currentPriceUct: String(bumpedPrice), lastPriceUpdateAt: new Date() } : {}),
        })
        .where(eq(listings.id, listing.id));

      if (shouldBump) {
        await db.insert(priceHistory).values({
          listingId: listing.id,
          priceUct: String(bumpedPrice),
          changedBy: 'buyer_demand',
        });
      }

      await db.insert(activityFeed).values({
        listingId: listing.id,
        eventType: 'sold',
        message: `"${listing.title}" sold to @${purchase.buyerNametag} for ${purchase.priceUct} UCT (${newSoldCount}/${listing.totalSupply} sold) (tx: ${paymentRequestId.slice(0, 16)}…)`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/purchase/confirm]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}