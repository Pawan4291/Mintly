import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, priceHistory, activityFeed } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { computeInitialPrice } from '@/lib/agent/pricingRule';
import { uploadImage } from '@/lib/supabaseStorage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const imageFile = formData.get('image') as File | null;
    const title = (formData.get('title') as string) || 'Untitled NFT';
    const description = (formData.get('description') as string) || '';
    const floorPriceUctStr = formData.get('floorPriceUct') as string;
    const sellerNametag = formData.get('sellerNametag') as string;
    const sellerAddress = formData.get('sellerAddress') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    if (!floorPriceUctStr || !sellerNametag || !sellerAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const floorPriceUct = parseFloat(floorPriceUctStr);
    if (isNaN(floorPriceUct) || floorPriceUct <= 0) {
      return NextResponse.json({ error: 'Floor price must be a positive number' }, { status: 400 });
    }

   const totalSupplyStr = formData.get('totalSupply') as string;
    const totalSupply = Math.max(1, parseInt(totalSupplyStr || '1', 10));

    const maxPerWalletStr = formData.get('maxPerWallet') as string;
    const maxPerWallet = maxPerWalletStr ? parseInt(maxPerWalletStr, 10) : null;

   const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const fileName = `${uuidv4()}.${ext}`;

    const imageUrl = await uploadImage(buffer, fileName, imageFile.type || 'image/jpeg');

    // Count existing listed NFTs for the supply signal
    const [{ value: competingListingsCount }] = await db
      .select({ value: count() })
      .from(listings)
      .where(eq(listings.status, 'listed'));

    // Agent computes the initial starting price — seller never sets this
    const initialPrice = computeInitialPrice(floorPriceUct, Number(competingListingsCount));

    // Insert the real listing row
    const [listing] = await db
      .insert(listings)
      .values({
        sellerNametag: sellerNametag.replace('@', ''),
        sellerAddress,
        imageUrl,
        title,
        description,
        floorPriceUct: String(floorPriceUct),
        currentPriceUct: String(initialPrice),
        totalSupply,
        maxPerWallet,
      })
      .returning();

    // Record initial price in price_history
    await db.insert(priceHistory).values({
      listingId: listing.id,
      priceUct: String(initialPrice),
      changedBy: 'agent:initial',
    });

    // Record listing event in activity_feed
    await db.insert(activityFeed).values({
      listingId: listing.id,
      eventType: 'listed',
      message: `@${sellerNametag.replace('@', '')} listed "${title}" — starting price: ${initialPrice} UCT (floor: ${floorPriceUct} UCT, set by agent)`,
    });

    return NextResponse.json({ listingId: listing.id, initialPrice });
  } catch (err) {
    console.error('[api/listings/create]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
