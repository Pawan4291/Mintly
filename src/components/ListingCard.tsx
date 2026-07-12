'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingDown, Tag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export interface ListingCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sellerNametag: string;
  currentPriceUct: string;
  floorPriceUct: string;
  status: string;
  createdAt: string;
  lastPriceUpdateAt: string;
  totalSupply?: number;
  soldCount?: number;
  isResale?: boolean;
}

interface Props {
  listing: ListingCardData;
  index?: number;
}

export default function ListingCard({ listing, index = 0 }: Props) {
  const floorNum = Number(listing.floorPriceUct);
  const currentNum = Number(listing.currentPriceUct);
  const premiumPct = floorNum > 0
    ? Math.round(((currentNum - floorNum) / floorNum) * 100)
    : 0;

  const createdDate = new Date(listing.createdAt);
  const hoursAgo = Math.round((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
  const timeLabel = hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`;

 const isSold = listing.status === 'sold';
  const isDelisted = listing.status === 'delisted';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      className="group relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(39,39,42,0.9), rgba(24,24,27,0.9))',
        border: '1px solid rgba(249,115,22,0.15)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Image */}
     <div className="relative aspect-square overflow-hidden bg-zinc-900">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = '0';
          }}
        />
        <div className="absolute inset-0 -z-10 flex items-center justify-center text-zinc-700 text-xs">
          Image unavailable
        </div>
        {/* Sold overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <span className="text-white font-bold text-2xl rotate-[-15deg] border-4 border-white/50 px-4 py-2 rounded-lg">
              SOLD
            </span>
          </div>
        )}
        {/* Price decay indicator */}
        {!isSold && premiumPct > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/90 text-white text-xs font-bold">
            <TrendingDown size={10} />
            {premiumPct}% above floor
          </div>
        )}
        {/* Floor badge */}
        {!isSold && premiumPct === 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-green-500/90 text-white text-xs font-bold">
            Floor Price
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-white text-base line-clamp-1">{listing.title}</h3>
        </div>
       <p className="text-zinc-500 text-xs mb-3 flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Tag size={10} />
            @{listing.sellerNametag}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            listing.isResale ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
          }`}>
            {listing.isResale ? 'Resale' : 'Marketplace'}
          </span>
        </p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Current Price</p>
            <p className="text-orange-400 font-bold text-xl">
              {Number(listing.currentPriceUct).toFixed(4)}
              <span className="text-sm text-orange-300/70 ml-1">UCT</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs mb-0.5">Floor</p>
            <p className="text-zinc-400 text-sm font-medium">
              {Number(listing.floorPriceUct).toFixed(4)} UCT
            </p>
          </div>
        </div>

       <div className="flex items-center justify-between text-xs text-zinc-600 mb-2">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeLabel}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isSold
              ? 'bg-zinc-700 text-zinc-400'
              : 'bg-orange-500/10 text-orange-400'
          }`}>
            {isSold ? 'Sold' : isDelisted ? 'Removed' : 'Listed'}
          </span>
        </div>

        {typeof listing.totalSupply === 'number' && (
          <p className="text-xs text-zinc-500 mb-3">
            {listing.soldCount ?? 0}/{listing.totalSupply} sold
          </p>
        )}

        <Link
          href={`/listing/${listing.id}`}
          className="block w-full text-center py-2 rounded-xl font-semibold text-sm transition-all duration-200"
          style={
            isSold
              ? { background: 'rgba(63,63,70,0.5)', color: '#71717a' }
              : {
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.15))',
                  border: '1px solid rgba(249,115,22,0.3)',
                  color: '#f97316',
                }
          }
        >
          {isSold ? 'View Details' : isDelisted ? 'Removed' : 'View & Buy'}
        </Link>
      </div>

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: 'linear-gradient(135deg, rgba(249,115,22,0.05), transparent)',
          boxShadow: 'inset 0 0 0 1px rgba(249,115,22,0.3)',
        }}
      />
    </motion.div>
  );
}
