import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') ?? 'listed';
    const resaleParam = searchParams.get('resale') ?? 'exclude'; // 'exclude' | 'only' | 'all'
    const includeAll = statusParam === 'all';

    const conditions = [];
    if (!includeAll) conditions.push(eq(listings.status, statusParam));
    if (resaleParam === 'exclude') conditions.push(eq(listings.isResale, false));
    if (resaleParam === 'only') conditions.push(eq(listings.isResale, true));

    // Fetch real listings from the database
    const rows = await db
      .select()
      .from(listings)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(listings.createdAt));

    return NextResponse.json({ listings: rows });
  } catch (err) {
    console.error('[api/listings/list]', err);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
