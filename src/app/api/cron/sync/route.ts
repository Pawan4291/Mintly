import { NextRequest, NextResponse } from 'next/server';
import { runCycle } from '@/lib/agent/runCycle';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await runCycle();
    return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/sync]', err);
    return NextResponse.json({ error: 'Agent cycle failed' }, { status: 500 });
  }
}