import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityFeed } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    // Fetch real activity_feed rows, newest first
    const rows = await db
      .select()
      .from(activityFeed)
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ activity: rows, limit, offset });
  } catch (err) {
    console.error('[api/activity]', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
