'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, ShoppingBag, Package, Bot, Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import WalletConnectButton from '@/components/WalletConnectButton';
import ListingCard, { type ListingCardData } from '@/components/ListingCard';
import Link from 'next/link';

interface PurchaseRow {
  purchase: {
    id: string;
    listingId: string;
    priceUct: string;
    quantity: number;
    status: string;
    createdAt: string;
    confirmedAt: string | null;
    txId: string | null;
    paymentRequestId: string | null;
  };
  listing: ListingCardData | null;
}

type Tab = 'listings' | 'purchases';

export default function MyListingsPage() {
  const { connected, identity } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [myListings, setMyListings] = useState<ListingCardData[]>([]);
  const [myPurchases, setMyPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connected || !identity) return;
    const nametag = identity.nametag ?? identity.chainPubkey;
    setLoading(true);
    Promise.all([
      fetch(`/api/my/listings?nametag=${encodeURIComponent(nametag)}`).then((r) => r.json()),
      fetch(`/api/my/purchases?nametag=${encodeURIComponent(nametag)}`).then((r) => r.json()),
    ])
      .then(([listingsData, purchasesData]) => {
        setMyListings((listingsData as { listings: ListingCardData[] }).listings ?? []);
        setMyPurchases((purchasesData as { purchases: PurchaseRow[] }).purchases ?? []);
      })
      .finally(() => setLoading(false));
  }, [connected, identity]);

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <Wallet size={32} className="text-zinc-600" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Connect your wallet</h2>
          <p className="text-zinc-500 text-sm">Connect your Sphere wallet to view your NFTs and purchases</p>
        </div>
        <WalletConnectButton />
      </div>
    );
  }

  const nametag = identity?.nametag;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <User size={22} className="text-orange-400" />
            <h1 className="text-3xl font-black text-white">My NFTs</h1>
          </div>
          {nametag && (
            <p className="text-zinc-500 text-sm">@{nametag}</p>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'listings' as Tab, label: 'My Listings', icon: Package, count: myListings.length },
            { id: 'purchases' as Tab, label: 'My Purchases', icon: ShoppingBag, count: myPurchases.length },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                activeTab === id
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon size={14} />
              {label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === id ? 'bg-white/20' : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" style={{ height: 380 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Listings tab */}
            {activeTab === 'listings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {myListings.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <Package size={32} className="text-zinc-700 mx-auto" />
                    <p className="text-zinc-500">You haven&apos;t listed any NFTs yet</p>
                    <Link href="/upload">
                      <motion.div
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white cursor-pointer"
                        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                      >
                        List Your First NFT
                      </motion.div>
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                   {myListings.map((listing, i) => (
                      <div key={listing.id} className="space-y-2">
                        <ListingCard listing={listing} index={i} />
                        {listing.status === 'listed' && (
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                await fetch(`/api/listings/${listing.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ sellerNametag: listing.sellerNametag, action: 'delist' }),
                                });
                                window.location.reload();
                              }}
                              className="flex-1 py-2 rounded-lg text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/30"
                            >
                              Remove from Marketplace
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Permanently delete this NFT? This cannot be undone.')) return;
                                await fetch(`/api/listings/${listing.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ sellerNametag: listing.sellerNametag, action: 'destroy' }),
                                });
                                window.location.reload();
                              }}
                              className="flex-1 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30"
                            >
                              Delete Permanently
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Purchases tab */}
            {activeTab === 'purchases' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {myPurchases.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <ShoppingBag size={32} className="text-zinc-700 mx-auto" />
                    <p className="text-zinc-500">No purchases yet</p>
                    <Link href="/marketplace">
                      <motion.div
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold cursor-pointer"
                        style={{
                          background: 'rgba(249,115,22,0.1)',
                          border: '1px solid rgba(249,115,22,0.3)',
                          color: '#f97316',
                        }}
                      >
                        Browse Marketplace
                      </motion.div>
                    </Link>
                  </div>
                ) : (
                  myPurchases.map(({ purchase, listing }, i) => (
                    <motion.div
                      key={purchase.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl flex items-center gap-4"
                      style={{
                        background: 'rgba(24,24,27,0.8)',
                        border: `1px solid ${
                          purchase.status === 'confirmed'
                            ? 'rgba(34,197,94,0.2)'
                            : purchase.status === 'failed'
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(249,115,22,0.15)'
                        }`,
                      }}
                    >
                      {listing && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">
                          {listing?.title ?? 'Unknown NFT'}
                        </p>
                       <p className="text-zinc-500 text-xs">
                          Paid: <span className="text-orange-400 font-medium">{Number(purchase.priceUct).toFixed(4)} UCT</span>
                          {purchase.quantity > 1 && <span className="text-zinc-500"> · Qty: {purchase.quantity}</span>}
                        </p>
                        {purchase.txId && (
                          <p className="text-zinc-600 text-xs font-mono truncate mt-0.5">
                            tx: {purchase.txId.slice(0, 24)}…
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          purchase.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-400'
                            : purchase.status === 'failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {purchase.status === 'pending' && <Bot size={10} />}
                          {purchase.status}
                        </span>
                        <p className="text-zinc-600 text-xs mt-1">
                          {new Date(purchase.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
