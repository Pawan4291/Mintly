import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get('listingId');
  const buyerNametag = searchParams.get('buyerNametag')?.replace('@', '');

  if (!listingId || !buyerNametag) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.listingId, listingId), eq(purchases.buyerNametag, buyerNametag), ne(purchases.status, 'failed')));

  const boughtQuantity = rows.reduce((sum, p) => sum + (p.quantity ?? 1), 0);
  return NextResponse.json({ boughtQuantity });
}