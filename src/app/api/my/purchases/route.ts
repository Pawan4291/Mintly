import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, listings } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nametag = searchParams.get('nametag');

    if (!nametag) {
      return NextResponse.json({ error: 'nametag is required' }, { status: 400 });
    }

    const normalized = nametag.replace('@', '');

    const rows = await db
      .select({
        purchase: purchases,
        listing: listings,
      })
      .from(purchases)
      .leftJoin(listings, eq(purchases.listingId, listings.id))
      .where(eq(purchases.buyerNametag, normalized))
      .orderBy(desc(purchases.createdAt));

    // Merge rows that belong to the same listing into one card,
    // summing quantity/price, keeping the most recent tx + status.
    const merged = new Map<string, typeof rows[number] & { totalQuantity: number; totalPaid: number; txIds: string[] }>();

    for (const row of rows) {
      const key = row.purchase.listingId as string;
      const qty = row.purchase.quantity ?? 1;
      const paid = Number(row.purchase.priceUct);

      if (!merged.has(key)) {
        merged.set(key, {
          ...row,
          totalQuantity: qty,
          totalPaid: paid,
          txIds: row.purchase.txId ? [row.purchase.txId] : [],
        });
      } else {
        const existing = merged.get(key)!;
        existing.totalQuantity += qty;
        existing.totalPaid += paid;
        if (row.purchase.txId) existing.txIds.push(row.purchase.txId);
        // keep the newest purchase's status/date as representative (rows already sorted desc)
      }
    }

    const purchaseIds = Array.from(merged.keys());
    const resaleRows = purchaseIds.length
      ? await db
          .select()
          .from(listings)
          .where(inArray(listings.sourcePurchaseId, purchaseIds))
      : [];

    for (const [key, entry] of merged) {
      const related = resaleRows.filter((r) => r.sourcePurchaseId === key);
      const reserved = related
        .filter((r) => r.status === 'listed' || r.status === 'sold')
        .reduce((sum, r) => sum + r.totalSupply, 0);
      const soldViaResale = related.reduce((sum, r) => sum + r.soldCount, 0);
      (entry as any).availableQuantity = Math.max(0, entry.totalQuantity - reserved);
      (entry as any).soldViaResale = soldViaResale;
    }

    return NextResponse.json({ purchases: Array.from(merged.values()) });
  } catch (err) {
    console.error('[api/my/purchases]', err);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}