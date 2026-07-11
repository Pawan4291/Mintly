import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nametag = searchParams.get('nametag');

    if (!nametag) {
      return NextResponse.json({ error: 'nametag is required' }, { status: 400 });
    }

    const normalized = nametag.replace('@', '');

    // Fetch real listings for this seller
    const rows = await db
      .select()
      .from(listings)
      .where(eq(listings.sellerNametag, normalized))
      .orderBy(desc(listings.createdAt));

    return NextResponse.json({ listings: rows });
  } catch (err) {
    console.error('[api/my/listings]', err);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
