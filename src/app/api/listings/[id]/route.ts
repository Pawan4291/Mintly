import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, priceHistory, activityFeed, purchases } from '@/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { deleteImage } from '@/lib/supabaseStorage';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id));

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const history = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.listingId, id))
      .orderBy(asc(priceHistory.createdAt));

    return NextResponse.json({ listing, priceHistory: history });
  } catch (err) {
    console.error('[api/listings/[id]]', err);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sellerNametag } = await req.json() as { sellerNametag: string };

    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    if (listing.sellerNametag !== sellerNametag.replace('@', '')) {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
    }
    if (listing.status === 'sold') {
      return NextResponse.json({ error: 'Cannot delete a sold listing' }, { status: 409 });
    }

    await db.update(listings).set({ status: 'delisted' }).where(eq(listings.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/listings/[id] DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { sellerNametag, action } = await req.json() as { sellerNametag: string; action: 'delist' | 'destroy' };

    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.sellerNametag !== sellerNametag.replace('@', '')) {
      return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
    }
    if (listing.status === 'sold') {
      return NextResponse.json({ error: 'Cannot modify a sold listing' }, { status: 409 });
    }

   if (action === 'destroy') {
      if (listing.isResale) {
        return NextResponse.json({ error: 'Resale listings cannot be permanently deleted' }, { status: 403 });
      }

      const relatedPurchases = await db.select().from(purchases).where(eq(purchases.listingId, id));
      const purchaseIds = relatedPurchases.map((p) => p.id);

      if (purchaseIds.length > 0) {
        const resaleChildren = await db
          .select()
          .from(listings)
          .where(inArray(listings.sourcePurchaseId, purchaseIds));

        if (resaleChildren.length > 0) {
          return NextResponse.json(
            { error: 'Cannot delete — one or more sales from this NFT have been listed for resale' },
            { status: 409 }
          );
        }
      }

      const fileName = listing.imageUrl.split('/').pop() ?? '';
      if (fileName) await deleteImage(fileName);
      await db.delete(purchases).where(eq(purchases.listingId, id));
      await db.delete(activityFeed).where(eq(activityFeed.listingId, id));
      await db.delete(priceHistory).where(eq(priceHistory.listingId, id));
      await db.delete(listings).where(eq(listings.id, id));
    } else {
      await db.update(listings).set({ status: 'delisted' }).where(eq(listings.id, id));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/listings/[id] PATCH]', err);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}