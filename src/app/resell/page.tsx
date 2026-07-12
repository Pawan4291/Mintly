'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import WalletConnectButton from '@/components/WalletConnectButton';

export default function ResellPage() {
  return (
    <Suspense fallback={null}>
      <ResellPageInner />
    </Suspense>
  );
}

function ResellPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { connected, identity } = useWallet();

  const listingId = params.get('listingId') ?? '';
  const purchaseId = params.get('purchaseId') ?? '';
  const maxQty = Number(params.get('maxQty') ?? 1);

  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <p className="text-zinc-500">Connect your wallet to resell an NFT</p>
        <WalletConnectButton />
      </div>
    );
  }

  if (!listingId || !purchaseId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-zinc-500">Open this page via "Sell Instantly" from My Purchases</p>
      </div>
    );
  }

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/resell/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceListingId: listingId,
          purchaseId,
          sellerNametag: identity?.nametag,
          sellerAddress: identity?.chainPubkey,
          quantity: qty,
          fixedPriceUct: price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to list');
      router.push('/my-listings');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to list');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-24 max-w-md mx-auto">
      <h1 className="text-2xl font-black text-white mb-6">Sell Instantly</h1>

      <label className="block text-sm text-zinc-400 mb-1">Quantity (you own {maxQty})</label>
      <input
        type="number"
        min={1}
        max={maxQty}
        value={qty}
        onChange={(e) => setQty(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
        className="w-full mb-4 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
      />

      <label className="block text-sm text-zinc-400 mb-1">Fixed price per NFT (UCT)</label>
      <input
        type="number"
        min={0.01}
        step={0.01}
        value={price}
        onChange={(e) => setPrice(Math.max(0.01, Number(e.target.value)))}
        className="w-full mb-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white"
      />
      <p className="text-xs text-zinc-600 mb-6">This price is fixed — it will not rise or drop.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full py-3 rounded-xl font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
      >
        {submitting ? 'Listing...' : 'List for Instant Sale'}
      </button>
    </div>
  );
}