import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      purchaseId: string;
      paymentRequestId: string;
    };

    const { purchaseId, paymentRequestId } = body;

    if (!purchaseId || !paymentRequestId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the purchase row with the real payment request ID from the Sphere SDK
    await db
      .update(purchases)
      .set({ paymentRequestId })
      .where(eq(purchases.id, purchaseId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/purchase/confirm]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
