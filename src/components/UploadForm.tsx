'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Bot, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { createPaymentRequest } from '@/lib/sphere/payments';
import { useRouter } from 'next/navigation';

type Step = 'form' | 'uploading' | 'success' | 'error';

export default function UploadForm() {
  const { connected, identity, client } = useWallet();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [newListingId, setNewListingId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    floorPriceUct: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [feePaid, setFeePaid] = useState(false);
 const [payingFee, setPayingFee] = useState(false);
  const [feeError, setFeeError] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  async function handlePayFee() {
    if (!connected || !identity) return;
    if (!formData.floorPriceUct || Number(formData.floorPriceUct) <= 0) {
      setErrorMsg('Enter a floor price first');
      return;
    }
    setPayingFee(true);
    setErrorMsg('');
    setFeeError(false);
    try {
      const feeAmount = Number(formData.floorPriceUct) * 0.05;
      await createPaymentRequest(client, {
        sellerNametag: 'pawan429',
        buyerNametag: identity.nametag ?? identity.chainPubkey,
        amountUct: feeAmount,
        listingId: 'listing-fee',
        nftTitle: formData.title || 'Untitled NFT',
      });
      setFeePaid(true);
    } catch (err) {
      setFeeError(true);
      setErrorMsg('You cancelled the payment. Fee must be paid to list your NFT.');
    } finally {
      setPayingFee(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!connected || !identity) return;
    if (!imageFile) { setErrorMsg('Please select an image'); return; }
    if (!formData.floorPriceUct || Number(formData.floorPriceUct) <= 0) {
      setErrorMsg('Floor price must be greater than 0');
      return;
    }

    setStep('uploading');
    setErrorMsg('');

   try {
      const body = new FormData();
      body.append('image', imageFile);
      body.append('title', formData.title || 'Untitled NFT');
      body.append('description', formData.description);
      body.append('floorPriceUct', formData.floorPriceUct);
      body.append('sellerNametag', identity.nametag ?? identity.chainPubkey);
      body.append('sellerAddress', identity.directAddress ?? identity.chainPubkey);

      const res = await fetch('/api/listings/create', {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? 'Failed to create listing');
      }

      const data = await res.json() as { listingId?: string };
      setNewListingId(data.listingId ?? '');
      setStep('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  }

  if (!connected) {
    return (
      <div className="text-center py-16 text-zinc-500">
        Connect your Sphere wallet to upload and list NFTs
      </div>
    );
  }

  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">NFT Listed!</h2>
        <p className="text-zinc-400 max-w-sm mx-auto">
          The autonomous agent has set the starting price based on real market signals.
          Prices will decay automatically toward your floor price over time.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`/listing/${newListingId}`)}
            className="px-6 py-2.5 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            View Listing
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setStep('form'); setImageFile(null); setImagePreview(null); setFormData({ title: '', description: '', floorPriceUct: '' }); }}
            className="px-6 py-2.5 rounded-xl font-semibold text-zinc-400 border border-zinc-700 hover:border-orange-500/30 transition-colors"
          >
            List Another
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
          dragOver
            ? 'border-orange-500 bg-orange-500/10'
            : imagePreview
            ? 'border-orange-500/30 bg-zinc-900/50'
            : 'border-zinc-700 bg-zinc-900/30 hover:border-orange-500/50 hover:bg-orange-500/5'
        }`}
        style={{ minHeight: 220 }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {imagePreview ? (
          <div className="relative w-full" style={{ minHeight: 220 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-80 object-cover rounded-2xl"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-2xl">
              <span className="text-white font-semibold">Change Image</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center">
              <ImageIcon size={20} className="text-zinc-500" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium text-sm">Drop image here or click to upload</p>
              <p className="text-zinc-600 text-xs mt-1">PNG, JPG, GIF, WEBP up to 10MB</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Upload size={14} className="text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">Select File</span>
            </div>
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">NFT Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Cosmic Sphere #001"
            maxLength={80}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all duration-200 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe your NFT…"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all duration-200 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Floor Price (UCT)
            <span className="ml-2 text-xs text-zinc-500 font-normal">
              — minimum the agent will ever drop to
            </span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.floorPriceUct}
              onChange={(e) => setFormData((f) => ({ ...f, floorPriceUct: e.target.value }))}
              placeholder="1.0000"
              min="0.0001"
              step="0.0001"
              required
              className="w-full px-4 py-3 pr-16 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all duration-200 text-sm"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 font-bold text-sm">
              UCT
            </span>
          </div>
        <div className={`mt-3 p-3 rounded-xl bg-zinc-900 border flex items-center justify-between gap-3 transition-colors duration-200 ${feeError ? 'border-red-500/60' : 'border-zinc-700'}`}>
            <span className="text-sm text-zinc-300">
              Listing fee: <span className="text-orange-400 font-bold">{(Number(formData.floorPriceUct || 0) * 0.05).toFixed(4)} UCT</span>
              <span className="text-zinc-500"> (5% of floor, to @pawan429)</span>
            </span>
            {feePaid ? (
              <CheckCircle size={20} className="text-green-400 shrink-0" />
            ) : (
              <button
                type="button"
                onClick={handlePayFee}
                disabled={payingFee || !formData.floorPriceUct}
                className="px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-semibold disabled:opacity-50 shrink-0"
              >
                {payingFee ? 'Paying…' : 'Pay Fee'}
              </button>
            )}
          </div>
        </div>

        {/* Agent notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15"
        >
          <Bot size={16} className="text-orange-400 mt-0.5 shrink-0" />
          <div className="text-xs text-zinc-400 leading-relaxed">
            <span className="text-orange-400 font-semibold">Autonomous pricing: </span>
            You only set the floor price. The agent computes the starting price (3× floor) and
            autonomously decays it over time based on real market signals — no human sets the sale price.
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {(step === 'error' || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle size={14} />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={step === 'uploading' || !imageFile || !feePaid}
        className="w-full py-3.5 rounded-xl font-bold text-white text-base relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          boxShadow: '0 0 24px rgba(249,115,22,0.4)',
        }}
      >
        {step === 'uploading' ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Listing NFT…
          </span>
        ) : (
          'List NFT on Mintly'
        )}
      </motion.button>
    </form>
  );
}
