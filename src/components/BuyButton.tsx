'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Loader2, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useRouter } from 'next/navigation';

interface Props {
  listingId: string;
  sellerNametag: string;
  currentPriceUct: string;
  nftTitle: string;
  status: string;
}

type BuyState = 'idle' | 'loading' | 'success' | 'error';

export default function BuyButton({
  listingId,
  sellerNametag,
  currentPriceUct,
  nftTitle,
  status,
}: Props) {
  const { connected, identity, client } = useWallet();
  const [buyState, setBuyState] = useState<BuyState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const router = useRouter();

  const isSold = status === 'sold';
  const isOwnListing = identity?.nametag === sellerNametag ||
    identity?.nametag === sellerNametag.replace('@', '');

  async function handleBuy() {
    if (!connected || !identity || !client) return;
    if (isSold || isOwnListing) return;

    setBuyState('loading');
    setErrorMsg('');

    try {
      // Call our API route which creates the payment request
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          buyerNametag: identity.nametag ?? identity.chainPubkey,
          buyerAddress: identity.directAddress ?? identity.chainPubkey,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Purchase initiation failed');
      }

      const data = await res.json() as { purchaseId?: string; paymentRequestId?: string };
      setPurchaseId(data.purchaseId ?? '');

      // Now trigger the real Sphere payment intent on the client side
      // This opens the Sphere wallet UI for the buyer to confirm
      const priceBaseUnits = String(Math.round(Number(currentPriceUct) * 1_000_000));

      await client.intent('payment_request', {
        to: sellerNametag.startsWith('@') ? sellerNametag : `@${sellerNametag}`,
        amount: priceBaseUnits,
        coinId: 'uct',
        message: `Mintly NFT: ${nftTitle} (id: ${listingId.slice(0, 8)})`,
      });

      // Confirm the purchase row with the payment request info
      if (data.purchaseId) {
        await fetch('/api/purchase/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseId: data.purchaseId,
            paymentRequestId: data.paymentRequestId ?? `pr_${Date.now()}`,
          }),
        });
      }

      setBuyState('success');
      setTimeout(() => {
        router.refresh();
      }, 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setBuyState('error');
      setTimeout(() => setBuyState('idle'), 5000);
    }
  }

  if (isSold) {
    return (
      <div className="w-full py-3 rounded-xl text-center text-zinc-500 bg-zinc-800/50 border border-zinc-700/50 font-semibold">
        Sold
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="w-full py-3 rounded-xl text-center text-zinc-400 bg-zinc-800/30 border border-zinc-700/30 text-sm flex items-center justify-center gap-2">
        <Wallet size={14} />
        Connect Sphere wallet to buy
      </div>
    );
  }

if (isOwnListing) {
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
      setDeleting(true);
      try {
        const res = await fetch(`/api/listings/${listingId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerNametag: identity?.nametag }),
        });
       if (!res.ok) {
          const data = await res.json() as { error?: string };
          throw new Error(data.error ?? 'Delete failed');
        }
        router.push('/marketplace');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to remove listing');
      } finally {
        setDeleting(false);
      }
    }

    if (confirmingDelete) {
      async function handleDestroy() {
        setDeleting(true);
        await fetch(`/api/listings/${listingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sellerNametag: identity?.nametag, action: 'destroy' }),
        });
        router.push('/marketplace');
      }
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-center text-white bg-orange-600 text-xs font-semibold hover:bg-orange-700 disabled:opacity-60"
            >
              {deleting ? 'Removing…' : 'Remove from Marketplace'}
            </button>
            <button
              onClick={handleDestroy}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-center text-white bg-red-600 text-xs font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete Permanently'}
            </button>
          </div>
          <button
            onClick={() => setConfirmingDelete(false)}
            className="w-full py-2 rounded-xl text-center text-zinc-400 bg-zinc-800 text-xs font-semibold hover:bg-zinc-700"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setConfirmingDelete(true)}
        className="w-full py-3 rounded-xl text-center text-red-400 bg-red-500/10 border border-red-500/30 text-sm font-semibold hover:bg-red-500/20 transition-colors"
      >
        Remove Listing
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <motion.button
        whileHover={{ scale: buyState === 'idle' ? 1.02 : 1 }}
        whileTap={{ scale: buyState === 'idle' ? 0.98 : 1 }}
        onClick={handleBuy}
        disabled={buyState === 'loading' || buyState === 'success'}
        className="w-full py-3 rounded-xl font-bold text-base relative overflow-hidden disabled:cursor-not-allowed transition-all duration-200"
        style={
          buyState === 'success'
            ? { background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff' }
            : buyState === 'error'
            ? { background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff' }
            : {
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                boxShadow: '0 0 24px rgba(249,115,22,0.5)',
              }
        }
      >
        <AnimatePresence mode="wait">
          {buyState === 'loading' && (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <Loader2 size={16} className="animate-spin" />
              Opening Sphere Wallet…
            </motion.span>
          )}
          {buyState === 'success' && (
            <motion.span
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Payment Submitted!
            </motion.span>
          )}
          {buyState === 'error' && (
            <motion.span
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <AlertCircle size={16} />
              Failed — Try Again
            </motion.span>
          )}
          {buyState === 'idle' && (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} />
              Buy for {Number(currentPriceUct).toFixed(4)} UCT
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {buyState === 'success' && purchaseId && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-zinc-500 text-center"
          >
            Purchase pending confirmation — the agent will verify on testnet2
          </motion.p>
        )}
        {buyState === 'error' && errorMsg && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400 text-center"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
