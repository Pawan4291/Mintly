import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/contexts/WalletContext';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mintly — Autonomous NFT Marketplace on Unicity Sphere',
  description:
    'An autonomous-pricing NFT marketplace where an AI agent sets and settles every price. Built on Unicity Sphere testnet2.',
  openGraph: {
    title: 'Mintly',
    description: 'Autonomous NFT marketplace powered by Unicity Sphere',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white min-h-screen antialiased`}>
        <WalletProvider>
          <AnimatedBackground />
          <Navbar />
          <main className="relative z-10 pt-16 md:pt-16">
            {children}
          </main>
        </WalletProvider>
      </body>
    </html>
  );
}
