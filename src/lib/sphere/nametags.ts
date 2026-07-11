// Nametag resolution utilities
// Resolves Unicity nametags (@username) to chain pubkeys and direct addresses

export interface ResolvedNametag {
  nametag: string;
  chainPubkey: string;
  directAddress?: string;
}

// Server-side nametag resolution via Nostr relay lookup
// Used by API routes to resolve seller/buyer nametags
export async function resolveNametagServerSide(
  nametag: string
): Promise<ResolvedNametag | null> {
  const tag = nametag.startsWith('@') ? nametag.slice(1) : nametag;

  try {
    // Query the Nostr relay for nametag → pubkey binding
    // The testnet2 Nostr relay is wss://nostr-relay.testnet.unicity.network
    // We use a REST-compatible fetch to the relay's HTTP API if available,
    // otherwise we return null (resolution handled client-side via SDK)
    const relayHttp = 'https://nostr-relay.testnet.unicity.network';
    const resp = await fetch(`${relayHttp}/lookup?nametag=${encodeURIComponent(tag)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!resp.ok) return null;

    const data = await resp.json() as {
      nametag?: string;
      chainPubkey?: string;
      directAddress?: string;
    };

    if (!data.chainPubkey) return null;

    return {
      nametag: data.nametag ?? tag,
      chainPubkey: data.chainPubkey,
      directAddress: data.directAddress,
    };
  } catch {
    // Resolution failure is non-fatal for listing creation —
    // we store what we have and the agent can re-resolve later
    return null;
  }
}

// Format nametag for display — always prefixes with @
export function formatNametag(tag: string): string {
  return tag.startsWith('@') ? tag : `@${tag}`;
}

// Strip @ prefix for storage
export function normalizeNametag(tag: string): string {
  return tag.startsWith('@') ? tag.slice(1) : tag;
}
