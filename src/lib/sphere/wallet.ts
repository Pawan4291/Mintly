'use client';

// Sphere wallet connect utilities using the real ConnectClient / autoConnect protocol
// Reference: https://github.com/unicity-sphere/sphere-sdk/blob/main/docs/CONNECT.md

import { SPHERE_CONFIG } from './client';

export interface WalletIdentity {
  chainPubkey: string;
  directAddress?: string;
  nametag?: string;
}

export interface ConnectedWallet {
  connected: boolean;
  identity: WalletIdentity | null;
  balanceUct: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any | null;
  sessionId: string | null;
  disconnect: (() => Promise<void>) | null;
}

const SESSION_KEY = 'mintly-sphere-session';

export function getSavedSession(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function saveSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, sessionId);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

// Attempt a silent auto-connect (no UI) on page load if session exists
export async function trySilentConnect(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  identity: WalletIdentity;
  sessionId: string;
  disconnect: () => Promise<void>;
} | null> {
  if (typeof window === 'undefined') return null;
  const savedSession = getSavedSession();
  if (!savedSession) return null;

  try {
    const { autoConnect } = await import('@unicitylabs/sphere-sdk/connect/browser');
    const { SPHERE_NETWORKS } = await import('@unicitylabs/sphere-sdk/connect');

    const result = await autoConnect({
      dapp: { name: SPHERE_CONFIG.appName, url: SPHERE_CONFIG.appUrl },
      walletUrl: SPHERE_CONFIG.walletUrl,
      network: SPHERE_NETWORKS.testnet2,
      silent: true,
      resumeSessionId: savedSession,
    });

    const identity = await result.client.query('sphere_getIdentity') as WalletIdentity;
    return {
      client: result.client,
      identity,
      sessionId: result.connection.sessionId,
      disconnect: result.disconnect,
    };
  } catch {
    clearSession();
    return null;
  }
}

// Full connect flow — opens Sphere wallet popup/extension
export async function connectWallet(): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any;
  identity: WalletIdentity;
  sessionId: string;
  disconnect: () => Promise<void>;
}> {
  const { autoConnect } = await import('@unicitylabs/sphere-sdk/connect/browser');
  const { SPHERE_NETWORKS } = await import('@unicitylabs/sphere-sdk/connect');

  const result = await autoConnect({
    dapp: {
      name: SPHERE_CONFIG.appName,
      url: SPHERE_CONFIG.appUrl,
    },
    walletUrl: SPHERE_CONFIG.walletUrl,
    network: SPHERE_NETWORKS.testnet2,
    silent: false,
    resumeSessionId: getSavedSession() ?? undefined,
    permissions: [
      'identity:read',
      'balance:read',
      'transfer:request',
      'payment:request',
      'resolve:peer',
    ],
  });

  const identity = await result.client.query('sphere_getIdentity') as WalletIdentity;
  saveSession(result.connection.sessionId);

  return {
    client: result.client,
    identity,
    sessionId: result.connection.sessionId,
    disconnect: result.disconnect,
  };
}

// Query real UCT balance from connected wallet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUctBalance(client: any): Promise<string> {
  try {
    type AssetEntry = { coinId: string; symbol?: string; totalAmount?: string; balance?: string };
    const assets = await client.query('sphere_getAssets') as AssetEntry[];
    if (!Array.isArray(assets)) return '0.00';

    const uctAsset = assets.find(
      (a) =>
        (a.symbol && a.symbol.toUpperCase() === 'UCT') ||
        (a.coinId && a.coinId.toLowerCase().includes('uct'))
    );

    if (!uctAsset) return '0.00';
    const raw = uctAsset.totalAmount ?? uctAsset.balance ?? '0';
    const formatted = (Number(raw) / 1_000_000).toFixed(2);
    return formatted;
  } catch {
    return '0.00';
  }
}

// Resolve a nametag or address via sphere_resolve
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveIdentifier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  identifier: string
): Promise<{ chainPubkey: string; directAddress?: string } | null> {
  try {
    type ResolvedPeer = { chainPubkey?: string; directAddress?: string; address?: string };
    const resolved = await client.query('sphere_resolve', { identifier }) as ResolvedPeer;
    if (!resolved?.chainPubkey) return null;
    return {
      chainPubkey: resolved.chainPubkey,
      directAddress: resolved.directAddress ?? resolved.address,
    };
  } catch {
    return null;
  }
}
