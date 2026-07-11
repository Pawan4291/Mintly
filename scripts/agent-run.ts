#!/usr/bin/env node
/**
 * Mintly Autonomous Agent — Entry point for GitHub Actions cron job
 *
 * Run locally:
 *   DATABASE_URL=... SPHERE_ORACLE_API_KEY=... npx tsx scripts/agent-run.ts
 *
 * This script imports and executes runCycle() once, then exits.
 * The GitHub Actions workflow schedules this every 15 minutes.
 */

import 'dotenv/config';
import { runCycle } from '../src/lib/agent/runCycle';

async function main() {
  try {
    console.log('[mintly-agent] Starting agent run...');
    await runCycle();
    console.log('[mintly-agent] Agent run complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('[mintly-agent] Fatal error in agent cycle:', error);
    process.exit(1);
  }
}

main();
