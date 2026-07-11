'use client';

import { motion } from 'framer-motion';
import { TrendingDown, ShoppingBag, Plus, AlertCircle, Bot } from 'lucide-react';

export interface ActivityItem {
  id: string;
  listingId: string | null;
  eventType: string;
  message: string;
  createdAt: string;
}

interface Props {
  item: ActivityItem;
  index?: number;
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'price_drop':
      return <TrendingDown size={14} className="text-orange-400" />;
    case 'sold':
      return <ShoppingBag size={14} className="text-green-400" />;
    case 'listed':
      return <Plus size={14} className="text-blue-400" />;
    case 'purchase_failed':
      return <AlertCircle size={14} className="text-red-400" />;
    default:
      return <Bot size={14} className="text-zinc-400" />;
  }
}

function getEventColor(eventType: string) {
  switch (eventType) {
    case 'price_drop':
      return 'border-orange-500/20 bg-orange-500/5';
    case 'sold':
      return 'border-green-500/20 bg-green-500/5';
    case 'listed':
      return 'border-blue-500/20 bg-blue-500/5';
    case 'purchase_failed':
      return 'border-red-500/20 bg-red-500/5';
    default:
      return 'border-zinc-700/50 bg-zinc-900/50';
  }
}

function getEventLabel(eventType: string) {
  switch (eventType) {
    case 'price_drop': return 'Price Drop';
    case 'sold': return 'Sold';
    case 'listed': return 'New Listing';
    case 'purchase_failed': return 'Failed';
    default: return eventType;
  }
}

export default function ActivityFeedItem({ item, index = 0 }: Props) {
  const timeAgo = (() => {
    const diff = Date.now() - new Date(item.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${getEventColor(item.eventType)} transition-all duration-200 hover:opacity-90`}
    >
      <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
        {getEventIcon(item.eventType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-zinc-300">
            {getEventLabel(item.eventType)}
          </span>
          <span className="text-xs text-zinc-600">{timeAgo}</span>
        </div>
        <p className="text-sm text-zinc-400 leading-snug">{item.message}</p>
        {item.listingId && (
          <p className="text-xs text-zinc-600 mt-1 font-mono truncate">
            #{item.listingId.slice(0, 16)}…
          </p>
        )}
      </div>
    </motion.div>
  );
}
