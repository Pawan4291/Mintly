import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status') ?? 'listed';
    const includeAll = statusParam === 'all';

    // Fetch real listings from the database
    const rows = await db
      .select()
      .from(listings)
      .where(
        includeAll
          ? undefined
          : eq(listings.status, statusParam)
      )
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
