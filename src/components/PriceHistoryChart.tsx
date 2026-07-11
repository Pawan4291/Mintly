'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingDown } from 'lucide-react';

interface PricePoint {
  id: string;
  priceUct: string;
  changedBy: string;
  createdAt: string;
}

interface Props {
  history: PricePoint[];
  floorPrice: number;
  currentPrice: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-orange-500/30 rounded-lg p-3 text-sm shadow-xl">
        <p className="text-zinc-400 text-xs mb-1">{label}</p>
        <p className="text-orange-400 font-bold">
          {Number(payload[0].value).toFixed(4)} UCT
        </p>
        <p className="text-zinc-500 text-xs mt-1">by {payload[0].payload.changedBy}</p>
      </div>
    );
  }
  return null;
}

export default function PriceHistoryChart({ history, floorPrice, currentPrice }: Props) {
  if (!history.length) {
    return (
      <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
        No price history yet — agent cycle pending
      </div>
    );
  }

  const data = history.map((point) => ({
    date: new Date(point.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    price: Number(point.priceUct),
    changedBy: point.changedBy,
  }));

  const minPrice = Math.min(...data.map((d) => d.price), floorPrice) * 0.98;
  const maxPrice = Math.max(...data.map((d) => d.price)) * 1.02;

  const priceDrop = data.length > 1
    ? ((data[0].price - data[data.length - 1].price) / data[0].price * 100).toFixed(1)
    : '0.0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <TrendingDown size={14} className="text-orange-400" />
          <span>Price History ({history.length} data points)</span>
        </div>
        {Number(priceDrop) > 0 && (
          <span className="text-xs text-orange-400 font-medium">
            ↓{priceDrop}% total drop
          </span>
        )}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tick={{ fill: '#52525b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toFixed(2)}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={floorPrice}
              stroke="rgba(34,197,94,0.4)"
              strokeDasharray="4 4"
              label={{ value: 'Floor', fill: '#4ade80', fontSize: 10, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={currentPrice}
              stroke="rgba(249,115,22,0.4)"
              strokeDasharray="4 4"
              label={{ value: 'Current', fill: '#f97316', fontSize: 10, position: 'insideBottomRight' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-zinc-600 text-center">
        Prices set autonomously by the Mintly agent — no human in the loop
      </p>
    </motion.div>
  );
}
