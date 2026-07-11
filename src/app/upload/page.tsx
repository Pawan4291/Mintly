'use client';

import { motion } from 'framer-motion';
import { Plus, Lightbulb } from 'lucide-react';
import UploadForm from '@/components/UploadForm';
import { useWallet } from '@/contexts/WalletContext';
import WalletConnectButton from '@/components/WalletConnectButton';

export default function UploadPage() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Plus size={22} className="text-orange-400" />
            <h1 className="text-3xl font-black text-white">List Your NFT</h1>
          </div>
          <p className="text-zinc-500 text-sm">
            Upload your image and set your minimum price. The agent does the rest.
          </p>
        </motion.div>

        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl flex flex-col items-center gap-4 text-center"
            style={{
              background: 'rgba(249,115,22,0.05)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}
          >
            <p className="text-zinc-300 font-medium">Connect your Sphere wallet to continue</p>
            <WalletConnectButton />
          </motion.div>
        )}

        {/* Upload form */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 rounded-2xl"
          style={{
            background: 'rgba(24,24,27,0.8)',
            border: '1px solid rgba(249,115,22,0.12)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <UploadForm />
        </motion.div>

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl flex gap-3"
          style={{
            background: 'rgba(249,115,22,0.04)',
            border: '1px solid rgba(249,115,22,0.1)',
          }}
        >
          <Lightbulb size={14} className="text-orange-400 mt-0.5 shrink-0" />
          <div className="text-xs text-zinc-500 space-y-1 leading-relaxed">
            <p><span className="text-zinc-300 font-medium">How pricing works:</span> The agent starts your NFT at 3× your floor price and decays it by ~2% per hour. With more competing listings, prices decay faster. Your floor is the absolute minimum — guaranteed.</p>
            <p><span className="text-zinc-300 font-medium">Settlement:</span> When a buyer sends UCT through Sphere, the agent checks real payment status on testnet2 and marks the sale complete autonomously.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
