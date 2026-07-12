'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef } from 'react';
import {
  Flame,
  Bot,
  TrendingDown,
  Zap,
  ArrowRight,
  Shield,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

const FEATURES = [
  {
    icon: Bot,
    title: 'Fully Autonomous Agent',
    desc: 'An on-chain agent — not a human — adjusts every listing price on a real schedule based on time elapsed and competing supply.',
    color: '#f97316',
  },
  {
    icon: TrendingDown,
    title: 'Deterministic Pricing',
    desc: 'Prices decay toward your floor using a pure, reviewable formula. No randomness. Anyone can predict the price at any point.',
    color: '#fb923c',
  },
  {
    icon: Zap,
    title: 'Real Sphere Settlement',
    desc: 'Payments are real Unicity UCT transfers settled on testnet2. The agent checks on-chain status and marks sales — zero human confirmation.',
    color: '#fdba74',
  },
  {
    icon: Shield,
    title: 'Floor Price Guarantee',
    desc: "Set your minimum price once. The agent's decay algorithm never crosses it — sellers always receive at least their floor.",
    color: '#f97316',
  },
  {
    icon: Clock,
    title: 'Time-Based Decay',
    desc: "The longer your NFT sits unsold, the lower the price drops — automatically. The market finds the true clearing price.",
    color: '#fb923c',
  },
  {
    icon: DollarSign,
    title: 'UCT Only',
    desc: 'Pure Unicity UCT. No token swaps, no wrapped assets, no confusion. Everything in the native testnet2 token.',
    color: '#fdba74',
  },
];

const STEPS = [
  { n: '01', title: 'Connect Sphere Wallet', desc: 'Link your Unicity Sphere wallet — real nametag, real UCT balance.' },
  { n: '02', title: 'Upload & Set Floor', desc: 'Upload your NFT image and set only the minimum price you\'ll accept.' },
  { n: '03', title: 'Agent Takes Over', desc: 'The autonomous agent computes the starting price and schedules price decay.' },
  { n: '04', title: 'Buyer Pays, Agent Settles', desc: 'On purchase, the agent verifies the real Sphere payment and marks the sale complete.' },
];

export default function HomePage() {
  const { connected, connect } = useWallet();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.25)',
              color: '#fb923c',
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            Built for Unicity Sphere testnet2
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-4">
              <span className="text-white">The NFT market where</span>
              <br />
              <span className="gradient-text">the agent does everything</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Upload your NFT. Set a floor price. Walk away.
              <br />
              <span className="text-zinc-300">An autonomous agent sets prices, watches the market, and settles sales — on Unicity testnet2, in real UCT.</span>
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/marketplace">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 0 40px rgba(249,115,22,0.5), 0 4px 24px rgba(0,0,0,0.3)',
                }}
              >
                <Flame size={20} />
                Browse Marketplace
                <ArrowRight size={18} />
              </motion.div>
            </Link>

            {!connected ? (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={connect}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg"
                style={{
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.3)',
                  color: '#f97316',
                }}
              >
                Connect Sphere Wallet
              </motion.button>
            ) : (
              <Link href="/upload">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg cursor-pointer"
                  style={{
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    color: '#f97316',
                  }}
                >
                  List Your NFT
                  <ArrowRight size={18} />
                </motion.div>
              </Link>
            )}
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center justify-center gap-8 pt-4 flex-wrap"
          >
            {[
              { label: 'Network', value: 'testnet2' },
              { label: 'Token', value: 'UCT' },
              { label: 'Agent cycles', value: 'Every 20 min' },
              { label: 'Human approvals', value: 'Zero' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-orange-400 font-bold text-lg">{value}</div>
                <div className="text-zinc-600 text-xs">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-orange-400 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black text-white mb-4">How Mintly works</h2>
            <p className="text-zinc-400 text-lg">Four steps. Zero human pricing decisions.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-4 p-6 rounded-2xl glass-card glow-border"
              >
                <span
                  className="text-4xl font-black shrink-0 leading-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.5), rgba(249,115,22,0.2))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {step.n}
                </span>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black text-white mb-4">Built for real autonomy</h2>
            <p className="text-zinc-400 text-lg">Every feature backed by real Sphere SDK calls and a real database</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl glass-card transition-all duration-300"
                style={{ border: '1px solid rgba(249,115,22,0.12)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: `radial-gradient(circle, ${f.color}20, transparent)`,
                    border: `1px solid ${f.color}30`,
                  }}
                >
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center p-12 rounded-3xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.06))',
              border: '1px solid rgba(249,115,22,0.25)',
            }}
          >
            {/* Background glow */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)',
              }}
            />

            <div className="relative space-y-6">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 0 32px rgba(249,115,22,0.5)' }}>
                <Bot size={28} className="text-white" />
              </div>

              <div>
                <h2 className="text-3xl font-black text-white mb-3">
                  The agent is running right now
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                  Every 20 minutes, the Mintly agent checks every listed NFT, decays prices toward
                  the floor, verifies pending payments on Unicity testnet2, and records everything
                  in a real database. No human does any of this.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/activity">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  >
                    View Live Activity Feed
                    <ArrowRight size={16} />
                  </motion.div>
                </Link>
                <Link href="/marketplace">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold cursor-pointer"
                    style={{
                      background: 'rgba(249,115,22,0.1)',
                      border: '1px solid rgba(249,115,22,0.3)',
                      color: '#f97316',
                    }}
                  >
                    Browse NFTs
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-zinc-800/50 text-center text-zinc-600 text-sm">
        <p>
          Mintly — Autonomous NFT Marketplace on{' '}
          <a
            href="https://sphere.unicity.network"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500/70 hover:text-orange-400 transition-colors"
          >
            Unicity Sphere
          </a>{' '}
          testnet2 · NFT track + Autonomous Agents · No simulated data
        </p>
      </footer>
    </div>
  );
}
