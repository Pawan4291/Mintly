import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, listings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nametag = searchParams.get('nametag');

    if (!nametag) {
      return NextResponse.json({ error: 'nametag is required' }, { status: 400 });
    }

    const normalized = nametag.replace('@', '');

    // Fetch real purchases for this buyer, joined with listing data
    const rows = await db
      .select({
        purchase: purchases,
        listing: listings,
      })
      .from(purchases)
      .leftJoin(listings, eq(purchases.listingId, listings.id))
      .where(eq(purchases.buyerNametag, normalized))
      .orderBy(desc(purchases.createdAt));

    return NextResponse.json({ purchases: rows });
  } catch (err) {
    console.error('[api/my/purchases]', err);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}
