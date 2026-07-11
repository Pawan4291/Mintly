import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, purchases } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      listingId: string;
      buyerNametag: string;
      buyerAddress: string;
    };

    const { listingId, buyerNametag, buyerAddress } = body;

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
    if (listing.soldCount >= listing.totalSupply) {
      return NextResponse.json({ error: 'Sold out' }, { status: 409 });
    }

    // Prevent self-purchase
    const normalizedBuyer = buyerNametag.replace('@', '');
    if (normalizedBuyer === listing.sellerNametag) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 });
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
        priceUct: listing.currentPriceUct,
        paymentRequestId: null, // filled after client-side Sphere intent
        status: 'pending',
      })
      .returning();

    return NextResponse.json({
      purchaseId: purchase.id,
      listingId,
      priceUct: listing.currentPriceUct,
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
