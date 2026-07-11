'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Bot } from 'lucide-react';
import ActivityFeedItem, { type ActivityItem } from '@/components/ActivityFeedItem';

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 25;

  const fetchActivity = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    try {
      const res = await fetch(`/api/activity?limit=${LIMIT}&offset=${currentOffset}`);
      if (!res.ok) throw new Error('Failed to fetch activity');
      const data = await res.json() as { activity: ActivityItem[] };
      if (reset) {
        setItems(data.activity);
      } else {
        setItems((prev) => [...prev, ...data.activity]);
      }
      setHasMore(data.activity.length === LIMIT);
      if (!reset) setOffset(currentOffset + LIMIT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchActivity(true);
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchActivity(true);
    }, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    fetchActivity(true);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Activity size={22} className="text-orange-400" />
              <h1 className="text-3xl font-black text-white">Activity Feed</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition-all"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </motion.button>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-sm">
            <Bot size={12} className="text-orange-400" />
            Live events from the Mintly autonomous agent · auto-refreshes every 30s
          </div>
        </motion.div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg w-fit"
          style={{
            background: 'rgba(249,115,22,0.06)',
            border: '1px solid rgba(249,115,22,0.15)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-orange-400/80 text-xs font-medium">
            Polling testnet2 · Agent writes here on every price update and sale
          </span>
        </motion.div>

        {/* Feed */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 space-y-3"
          >
            <Activity size={32} className="text-zinc-700 mx-auto" />
            <p className="text-zinc-500 text-lg font-medium">No activity yet</p>
            <p className="text-zinc-600 text-sm">
              The agent will write here as NFTs are listed, priced, and sold
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <ActivityFeedItem key={item.id} item={item} index={i} />
            ))}

            {hasMore && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchActivity(false)}
                className="w-full py-3 rounded-xl text-zinc-500 text-sm border border-zinc-800 hover:border-orange-500/20 hover:text-zinc-300 transition-all duration-150 mt-4"
              >
                Load more
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
