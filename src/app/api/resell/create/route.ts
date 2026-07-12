import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, activityFeed, purchases } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sourceListingId: string;
      purchaseId: string;
      sellerNametag: string;
      sellerAddress: string;
      quantity: number;
      fixedPriceUct: number;
    };

    const { sourceListingId, purchaseId, sellerNametag, sellerAddress, quantity, fixedPriceUct } = body;

    if (!sourceListingId || !sellerNametag || !sellerAddress || !quantity || !fixedPriceUct) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (fixedPriceUct <= 0 || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid quantity or price' }, { status: 400 });
    }

    const [source] = await db.select().from(listings).where(eq(listings.id, sourceListingId));

    let title = source?.title;
    let imageUrl = source?.imageUrl;
    let description = source?.description ?? '';

    if (!source) {
      const [origPurchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId));
      if (!origPurchase?.nftTitle || !origPurchase?.nftImageUrl) {
        return NextResponse.json({ error: 'Original listing not found' }, { status: 404 });
      }
      title = origPurchase.nftTitle;
      imageUrl = origPurchase.nftImageUrl;
    }

    const [resaleListing] = await db
      .insert(listings)
      .values({
        sellerNametag: sellerNametag.replace('@', ''),
        sellerAddress,
        imageUrl: imageUrl!,
        title: title!,
        description,
        floorPriceUct: String(fixedPriceUct),
        currentPriceUct: String(fixedPriceUct),
        totalSupply: quantity,
        isResale: true,
        isFixedPrice: true,
        sourcePurchaseId: purchaseId,
      })
      .returning();

    await db.insert(activityFeed).values({
      listingId: resaleListing.id,
      eventType: 'listed',
      message: `@${sellerNametag.replace('@', '')} listed "${title}" for instant resale — fixed price: ${fixedPriceUct} UCT`,
    });

    return NextResponse.json({ listingId: resaleListing.id });
  } catch (err) {
    console.error('[api/resell/create]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}