import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, purchases } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      listingId: string;
      buyerNametag: string;
      buyerAddress: string;
      quantity?: number;
    };

    const { listingId, buyerNametag, buyerAddress } = body;
    const quantity = Math.max(1, body.quantity ?? 1);

    if (!listingId || !buyerNametag || !buyerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch the real listing
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId));

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.status !== 'listed') {
      return NextResponse.json(
        { error: `Listing is ${listing.status} — cannot purchase` },
        { status: 409 }
      );
    }
   const remaining = listing.totalSupply - listing.soldCount;
    if (remaining <= 0) {
      return NextResponse.json({ error: 'Sold out' }, { status: 409 });
    }
    if (quantity > remaining) {
      return NextResponse.json({ error: `Only ${remaining} left` }, { status: 409 });
    }

    // Prevent self-purchase
    const normalizedBuyer = buyerNametag.replace('@', '');
    if (normalizedBuyer === listing.sellerNametag) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 });
    }

    // Enforce per-wallet max if the seller set one
    if (listing.maxPerWallet) {
      const priorPurchases = await db
        .select()
        .from(purchases)
        .where(and(eq(purchases.listingId, listingId), eq(purchases.buyerNametag, normalizedBuyer)));

      const alreadyBought = priorPurchases
        .filter((p) => p.status !== 'failed')
        .reduce((sum, p) => sum + (p.quantity ?? 1), 0);

      if (alreadyBought + quantity > listing.maxPerWallet) {
        return NextResponse.json(
          { error: `Max ${listing.maxPerWallet} per wallet — you've already bought ${alreadyBought}` },
          { status: 409 }
        );
      }
    }

    // Insert a real pending purchase row
    // The payment_request_id will be filled in after the Sphere intent resolves on the client
    const [purchase] = await db
      .insert(purchases)
      .values({
        listingId,
        buyerNametag: normalizedBuyer,
        buyerAddress,
        sellerNametag: listing.sellerNametag,
        priceUct: String(Number(listing.currentPriceUct) * quantity),
        quantity,
        nftTitle: listing.title,
        nftImageUrl: listing.imageUrl,
        paymentRequestId: null, // filled after client-side Sphere intent
        status: 'pending',
      })
      .returning();

    return NextResponse.json({
      purchaseId: purchase.id,
      listingId,
      priceUct: purchase.priceUct,
      sellerNametag: listing.sellerNametag,
    });
  } catch (err) {
    console.error('[api/purchase]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
