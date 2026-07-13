# Mintly

An autonomous-pricing NFT marketplace built for Unicity Sphere testnet2 — an agent sets and settles every price, no human in the loop.

**Track:** NFT (with Autonomous Agents overlap — the pricing/settlement agent is the core of the build)

## What it does

- A seller connects their Sphere wallet, uploads an image, and sets only a **floor price** in UCT. They never set the actual sale price.
- An autonomous agent (a real scheduled job, not a human) periodically checks every unsold listing and lowers its price on its own toward the floor, based on real elapsed time and real competing supply, writing every price change to a live database.
- When a buyer clicks Buy, a real Sphere payment is sent via the connected wallet; the agent independently confirms settlement on testnet2 and marks the sale complete.
- Buyers can instantly resell any confirmed purchase at a fixed price, creating a full buy → resell → buy loop.

No simulated or mocked data — all listings, prices, and sales are read from and written to a live Supabase (Postgres) database driven by real Sphere SDK calls against Unicity testnet2.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Supabase Postgres (via Drizzle ORM) + Supabase Storage for images
- `@unicitylabs/sphere-sdk` for wallet connect, payments, and balance/identity reads
- Agent runs as a scheduled job (QStash) calling an API route that invokes `runCycle.ts`
- Hosted on Vercel

## Running locally

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in real values:
   - Supabase project URL, anon key, service role key, and Postgres connection string
   - Sphere SDK oracle key / wallet API URL for testnet2
   - An agent wallet mnemonic + nametag (a dedicated Sphere testnet wallet for the agent)
3. Apply the database schema in Supabase (SQL Editor → run each file in `supabase/migrations/` in order).
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Run one agent cycle manually to test pricing/settlement logic:
   ```bash
   npx tsx scripts/agent-run.ts
   ```

## Deploying

1. Push the repo to GitHub.
2. Import it into Vercel and set the same environment variables from `.env.local` in the Vercel project settings.
3. Schedule the agent to run periodically (e.g. every 15–30 minutes) using QStash, pointing at an API route that invokes `runCycle.ts` on each trigger.

## Submission notes

- Does **not** use AstridOS.
- Agentic: the pricing and settlement logic runs on a schedule with no human approval step — see `src/lib/agent/runCycle.ts`.
- No simulated or mocked data — all listings, prices, and sales are read from and written to a live Supabase database driven by real Sphere SDK calls against Unicity testnet2.