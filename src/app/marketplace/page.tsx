'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Search, SlidersHorizontal, RefreshCw, Bot } from 'lucide-react';
import ListingCard, { type ListingCardData } from '@/components/ListingCard';

type FilterStatus = 'listed' | 'all' | 'sold';

export default function MarketplacePage() {
  const [listings, setListings] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('listed');
  const [refreshing, setRefreshing] = useState(false);

  async function fetchListings(status: FilterStatus = 'listed') {
    try {
      const res = await fetch(`/api/listings/list?status=${status}`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json() as { listings: ListingCardData[] };
      setListings(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchListings(filter);
    // Poll for updates every 60 seconds (agent runs every 20 min)
    const interval = setInterval(() => fetchListings(filter), 60_000);
    return () => clearInterval(interval);
  }, [filter]);

  const filteredListings = listings.filter((l) =>
    search
      ? l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.sellerNametag.toLowerCase().includes(search.toLowerCase())
      : true
  );

  function handleRefresh() {
    setRefreshing(true);
    fetchListings(filter);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <LayoutGrid size={22} className="text-orange-400" />
            <h1 className="text-3xl font-black text-white">Marketplace</h1>
          </div>
          <p className="text-zinc-500 text-sm flex items-center gap-1.5">
            <Bot size={12} className="text-orange-400" />
            Prices set and decayed autonomously by the Mintly agent · Unicity testnet2
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or seller…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-orange-500/40 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            {(['listed', 'all', 'sold'] as FilterStatus[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setLoading(true); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  filter === f
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-orange-500/30 hover:text-zinc-200'
                }`}
              >
                {f === 'listed' ? 'Listed' : f === 'all' ? 'All' : 'Sold'}
              </button>
            ))}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition-all duration-150 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </motion.button>
          </div>
        </div>

        {/* Listings grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" style={{ height: 380 }} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : filteredListings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 space-y-3"
          >
            <SlidersHorizontal size={32} className="text-zinc-700 mx-auto" />
            <p className="text-zinc-500 text-lg font-medium">
              {search ? 'No listings match your search' : 'No listings yet'}
            </p>
            {!search && (
              <p className="text-zinc-600 text-sm">
                Be the first to list an NFT on Mintly
              </p>
            )}
          </motion.div>
        ) : (
          <>
            <p className="text-zinc-600 text-sm mb-4">
              {filteredListings.length} listing{filteredListings.length !== 1 ? 's' : ''}
            </p>
            <AnimatePresence mode="popLayout">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredListings.map((listing, i) => (
                  <ListingCard key={listing.id} listing={listing} index={i} />
                ))}
              </div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
