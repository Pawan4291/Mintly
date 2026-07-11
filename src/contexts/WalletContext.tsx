'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { WalletIdentity } from '@/lib/sphere/wallet';
import {
  connectWallet,
  trySilentConnect,
  clearSession,
  getUctBalance,
} from '@/lib/sphere/wallet';

interface WalletContextValue {
  connected: boolean;
  identity: WalletIdentity | null;
  balanceUct: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  connected: false,
  identity: null,
  balanceUct: '0.00',
  client: null,
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
  refreshBalance: async () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState<WalletIdentity | null>(null);
  const [balanceUct, setBalanceUct] = useState('0.00');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [client, setClient] = useState<any | null>(null);
  const [connecting, setConnecting] = useState(false);
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);

  // Attempt silent reconnect on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConnecting(true);
      try {
        const result = await trySilentConnect();
        if (!cancelled && result) {
          setClient(result.client);
          setIdentity(result.identity);
          setConnected(true);
          disconnectRef.current = result.disconnect;
          const bal = await getUctBalance(result.client);
          if (!cancelled) setBalanceUct(bal);
        }
      } catch {
        // silent connect failed — user needs to click Connect
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const result = await connectWallet();
      setClient(result.client);
      setIdentity(result.identity);
      setConnected(true);
      disconnectRef.current = result.disconnect;
      const bal = await getUctBalance(result.client);
      setBalanceUct(bal);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (disconnectRef.current) {
        await disconnectRef.current();
      }
    } catch { /* ignore */ }
    clearSession();
    setConnected(false);
    setIdentity(null);
    setBalanceUct('0.00');
    setClient(null);
    disconnectRef.current = null;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!client) return;
    const bal = await getUctBalance(client);
    setBalanceUct(bal);
  }, [client]);

  return (
    <WalletContext.Provider
      value={{ connected, identity, balanceUct, client, connecting, connect, disconnect, refreshBalance }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
