'use client';

// Sphere SDK client configuration for Mintly
// All values are for Unicity testnet2 — safe to expose in client code

export const SPHERE_CONFIG = {
  network: 'testnet' as const,
  oracleApiKey: process.env.NEXT_PUBLIC_SPHERE_ORACLE_API_KEY ?? 'sk_ddc3cfcc001e4a28ac3fad7407f99590',
  walletApiUrl: process.env.NEXT_PUBLIC_SPHERE_WALLET_API_URL ?? 'https://wallet-api.unicity.network',
  walletUrl: 'https://sphere.unicity.network',
  appName: process.env.NEXT_PUBLIC_SPHERE_APP_NAME ?? 'Mintly',
  appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://mintly.vercel.app',
} as const;

export const UCT_COIN_ID = 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0';

// Smallest UCT unit — the SDK uses bigint amounts in base units
// UCT has 18 decimal places: 1 UCT = 1_000_000_000_000_000_000 base units
export const UCT_DECIMALS = 18;

export function parseUct(amount: string | number): bigint {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.round(n * 10 ** UCT_DECIMALS));
}

export function formatUct(baseUnits: string | bigint | number): string {
  const n = typeof baseUnits === 'bigint' ? Number(baseUnits) : Number(baseUnits);
  return (n / 10 ** UCT_DECIMALS).toFixed(2);
}

// Convert UCT human amount to base-unit string (for SDK intent calls)
export function uctToBaseUnitsString(uctAmount: number): string {
  return String(Math.round(uctAmount * 10 ** UCT_DECIMALS));
}
