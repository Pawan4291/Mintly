'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Bot } from 'lucide-react';
import ListingCard, { type ListingCardData } from '@/components/ListingCard';

export default function ResellBrowsePage() {
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/listings/list?status=listed&resale=only')
      .then((r) => r.json())
      .then((data: { listings: ListingCardData[] }) => setListings(data.listings ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Repeat size={22} className="text-orange-400" />
            <h1 className="text-3xl font-black text-white">Resell</h1>
          </div>
          <p className="text-zinc-500 text-sm flex items-center gap-1.5">
            <Bot size={12} className="text-orange-400" />
            Fixed-price NFTs resold instantly by owners
          </p>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" style={{ height: 380 }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 text-zinc-500">No resale listings yet</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}