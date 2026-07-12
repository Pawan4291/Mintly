import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, listings, activityFeed } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

      await db
        .update(listings)
        .set({ soldCount: newSoldCount, status: isSoldOut ? 'sold' : 'listed' })
        .where(eq(listings.id, listing.id));

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