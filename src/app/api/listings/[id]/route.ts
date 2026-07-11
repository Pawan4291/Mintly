import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings, priceHistory } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

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

    // Fetch real price history for this listing
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
