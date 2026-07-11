'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowLeft,
  Tag,
  Clock,
  TrendingDown,
  Bot,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import BuyButton from '@/components/BuyButton';

interface PricePoint {
  id: string;
  priceUct: string;
  changedBy: string;
  createdAt: string;
}

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sellerNametag: string;
  sellerAddress: string;
  currentPriceUct: string;
  floorPriceUct: string;
  status: string;
  createdAt: string;
  lastPriceUpdateAt: string;
  totalSupply: number;
  soldCount: number;
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/listings/${id}`);
        if (!res.ok) throw new Error('Listing not found');
        const data = await res.json() as { listing: ListingDetail; priceHistory: PricePoint[] };
        setListing(data.listing);
        setHistory(data.priceHistory);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-zinc-500">
        <p>{error || 'Listing not found'}</p>
        <Link href="/marketplace" className="text-orange-400 hover:text-orange-300">
          ← Back to marketplace
        </Link>
      </div>
    );
  }

  const currentNum = Number(listing.currentPriceUct);
  const floorNum = Number(listing.floorPriceUct);
  const premiumPct = floorNum > 0
    ? ((currentNum - floorNum) / floorNum * 100).toFixed(1)
    : '0';
  const decayPct = history.length > 1
    ? ((Number(history[0].priceUct) - currentNum) / Number(history[0].priceUct) * 100).toFixed(1)
    : '0';

  const createdDate = new Date(listing.createdAt);
  const hoursListed = ((Date.now() - createdDate.getTime()) / (1000 * 60 * 60)).toFixed(1);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Marketplace
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left — Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative rounded-2xl overflow-hidden aspect-square"
              style={{ border: '1px solid rgba(249,115,22,0.15)' }}>
              <Image
                src={listing.imageUrl}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {listing.status === 'sold' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-black text-4xl rotate-[-15deg] border-4 border-white/60 px-6 py-3 rounded-xl">
                    SOLD
                  </span>
                </div>
              )}
            </div>

            {/* Price decay visualizer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-4 rounded-xl"
              style={{ background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(249,115,22,0.1)' }}
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-400 flex items-center gap-1">
                  <TrendingDown size={12} className="text-orange-400" />
                  Price Decay Progress
                </span>
                <span className="text-orange-400 font-medium">{decayPct}% total drop</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100 - Number(premiumPct), 100)}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #f97316, #ea580c)' }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>Start</span>
                <span>Floor</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Title & seller */}
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 text-xs font-medium mb-2">
                <Bot size={10} />
                Agent-priced NFT
              </span>
              <h1 className="text-3xl font-black text-white mb-2">{listing.title}</h1>
              {listing.description && (
                <p className="text-zinc-400 text-sm leading-relaxed">{listing.description}</p>
              )}
              <div className="flex items-center gap-1.5 mt-3 text-sm text-zinc-500">
                <Tag size={12} />
                Listed by <span className="text-orange-400 font-medium">@{listing.sellerNametag}</span>
              </div>
            </div>

            {/* Price info */}
            <div className="p-5 rounded-2xl space-y-4"
              style={{ background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 text-xs mb-0.5">Current Price (agent-set)</p>
                  <p className="text-4xl font-black text-white">
                    {currentNum.toFixed(4)}
                    <span className="text-xl text-orange-400 ml-1">UCT</span>
                  </p>
                </div>
               <div className="text-right">
                  <p className="text-zinc-500 text-xs mb-0.5">Floor Price</p>
                  <p className="text-xl font-bold text-zinc-300">
                    {floorNum.toFixed(4)} <span className="text-sm text-zinc-500">UCT</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-500">
                {listing.soldCount}/{listing.totalSupply} sold
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Above floor', value: `${premiumPct}%`, color: Number(premiumPct) > 0 ? 'text-orange-400' : 'text-green-400' },
                  { label: 'Total drop', value: `${decayPct}%`, color: 'text-zinc-300' },
                  { label: 'Hours listed', value: hoursListed, color: 'text-zinc-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-2 rounded-lg bg-zinc-900/60">
                    <p className={`font-bold ${color}`}>{value}</p>
                    <p className="text-zinc-600 text-xs">{label}</p>
                  </div>
                ))}
              </div>

              {/* Buy button */}
              <BuyButton
                listingId={listing.id}
                sellerNametag={listing.sellerNametag}
                currentPriceUct={listing.currentPriceUct}
                nftTitle={listing.title}
                status={listing.status}
              />
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Clock size={12} />
                <span>Listed on {createdDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-500">
                <ExternalLink size={12} />
                <span className="font-mono text-xs truncate">Listing ID: {listing.id}</span>
              </div>
            </div>

            {/* Price history chart */}
            <div className="p-5 rounded-2xl"
              style={{ background: 'rgba(24,24,27,0.8)', border: '1px solid rgba(249,115,22,0.1)' }}>
              <PriceHistoryChart
                history={history}
                floorPrice={floorNum}
                currentPrice={currentNum}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
