'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flame, LayoutGrid, Plus, Activity, User, Repeat } from 'lucide-react';
import WalletConnectButton from './WalletConnectButton';

const links = [
  { href: '/marketplace', label: 'Market', icon: LayoutGrid },
  { href: '/upload', label: 'Create', icon: Plus },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/my-listings', label: 'My NFTs', icon: User },
  { href: '/resell', label: 'Resell', icon: Repeat },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 px-4"
      style={{
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(249,115,22,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              boxShadow: '0 0 12px rgba(249,115,22,0.5)',
            }}
          >
            <Flame size={16} className="text-white" />
          </motion.div>
          <span className="font-black text-xl tracking-tight">
            <span className="text-white">Mint</span>
            <span className="text-orange-500">ly</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-orange-500/10 border border-orange-500/20"
                    transition={{ type: 'spring', duration: 0.3 }}
                  />
                )}
                <Icon size={14} className="relative" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet button */}
        <WalletConnectButton />
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden items-center justify-around py-2 border-t border-zinc-800/50">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150 ${
                active ? 'text-orange-400' : 'text-zinc-500'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
