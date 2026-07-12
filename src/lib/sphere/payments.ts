'use client';

// Real Sphere payment request helpers
// Uses the ConnectClient `intent` calls for payment_request and send

import { uctToBaseUnitsString, UCT_COIN_ID } from './client';

export interface PaymentRequestParams {
  sellerNametag: string;
  buyerNametag: string;
  amountUct: number;
  listingId: string;
  nftTitle: string;
}

export interface PaymentRequestResult {
  paymentRequestId: string;
  status: 'pending' | 'completed' | 'failed';
}

// Create a real Sphere payment_request intent via the connected wallet
// The wallet prompts the buyer to confirm; on confirmation, the payment is
// certified on-chain and a paymentRequestId is returned.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createPaymentRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  params: PaymentRequestParams
): Promise<PaymentRequestResult> {
  const { sellerNametag, amountUct, listingId, nftTitle } = params;

  // Resolve coin ID - UCT is referenced by symbol in intents
  // Amount must be in base units as a string
  const baseUnits = uctToBaseUnitsString(amountUct);

  // Use payment_request intent — the wallet presents the seller's nametag and amount
  // to the buyer for confirmation. On confirmation the wallet sends UCT to seller.
 const result = await client.intent('send', {
    to: sellerNametag.startsWith('@') ? sellerNametag : `@${sellerNametag}`,
    amount: baseUnits,
    coinId: UCT_COIN_ID,
    message: `Purchase NFT: ${nftTitle} (listing: ${listingId})`,
  })as { txId?: string; transferId?: string; status?: string; paymentRequestId?: string };

  // The SDK returns a transferId / txId after settlement
  const paymentRequestId =
    result.paymentRequestId ??
    result.transferId ??
    result.txId ??
    `pr_${Date.now()}_${listingId.slice(0, 8)}`;

  return {
    paymentRequestId,
    status: result.status === 'completed' ? 'completed' : 'pending',
  };
}

// Check the status of an existing payment/transfer on testnet2
// Used by the agent to poll pending purchases
export async function checkTransferStatus(transferId: string): Promise<{
  confirmed: boolean;
  txId?: string;
}> {
  // The Sphere SDK v2 checks transfer status against the wallet-api mailbox
  // In agent context (Node.js), we use the wallet's payment history
  try {
    const response = await fetch(
      `${process.env.SPHERE_WALLET_API_URL ?? 'https://wallet-api.unicity.network'}/api/v1/transfers/${transferId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) return { confirmed: false };

    const data = await response.json() as { status?: string; txId?: string };
    return {
      confirmed: data.status === 'completed' || data.status === 'confirmed' || data.status === 'delivered',
      txId: data.txId,
    };
  } catch {
    return { confirmed: false };
  }
}
