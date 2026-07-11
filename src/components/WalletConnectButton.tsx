'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { Wallet, LogOut, ChevronDown, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function WalletConnectButton() {
  const { connected, identity, balanceUct, connecting, connect, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortAddress = identity?.directAddress
    ? `${identity.directAddress.slice(0, 8)}…${identity.directAddress.slice(-6)}`
    : identity?.chainPubkey
    ? `${identity.chainPubkey.slice(0, 8)}…`
    : null;

  const displayName = identity?.nametag
    ? `@${identity.nametag}`
    : shortAddress ?? 'Connected';

  async function handleCopy() {
    const addr = identity?.directAddress ?? identity?.chainPubkey ?? '';
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (connected) {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-medium text-sm hover:bg-orange-500/20 transition-all duration-200"
        >
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="hidden sm:block">{displayName}</span>
          <span className="font-bold text-orange-300">{balanceUct} UCT</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-64 rounded-xl bg-zinc-900 border border-orange-500/20 shadow-2xl shadow-orange-500/10 overflow-hidden z-50"
            >
              <div className="p-3 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Wallet Identity</p>
                {identity?.nametag && (
                  <p className="text-orange-400 font-bold text-sm">@{identity.nametag}</p>
                )}
                <p className="text-zinc-400 text-xs font-mono truncate">{shortAddress}</p>
              </div>
              <div className="p-3 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Balance</p>
                <p className="text-white font-bold text-lg">{balanceUct} <span className="text-orange-400 text-sm">UCT</span></p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-150"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                  onClick={() => { setShowDropdown(false); disconnect(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
                >
                  <LogOut size={14} />
                  Disconnect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={connect}
      disabled={connecting}
      className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #f97316, #ea580c)',
        boxShadow: '0 0 20px rgba(249,115,22,0.4)',
      }}
    >
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%' }}
        animate={connecting ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 1, repeat: connecting ? Infinity : 0, ease: 'linear' }}
      />
      {connecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          <span className="text-white">Connecting…</span>
        </>
      ) : (
        <>
          <Wallet size={16} className="text-white" />
          <span className="text-white">Connect Sphere</span>
        </>
      )}
    </motion.button>
  );
}
