#!/usr/bin/env node
/**
 * Standalone E2E Test Runner for vote-ui.
 * Usage:
 *   node tests/runner.mjs [--tier=<1|2|3|4|all>] [--verbose] [--bail] [--filter=<pattern>]
 */
import { parseArgs } from 'node:util';
import { readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { harness } from './harness.mjs';
import {
  renderSummaryTable,
  printBanner,
  printTierHeader,
  printTierSubtotal,
  printFailures
} from './helpers/reporter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 1. Parse CLI arguments
const { values: args } = parseArgs({
  options: {
    tier: { type: 'string', default: 'all' },
    verbose: { type: 'boolean', default: false },
    bail: { type: 'boolean', default: false },
    filter: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: false
});

if (args.help) {
  console.log(`
vote-ui E2E Test Runner
-----------------------
Usage:
  node tests/runner.mjs [options]

Options:
  --tier=<1|2|3|4|all>  Specify which tier to execute (default: all)
  --verbose             Print individual test details and timing
  --bail                Stop execution immediately on first failure
  --filter=<pattern>    Run only tests matching the regex or substring
  -h, --help            Display this help message
`);
  process.exit(0);
}

// 2. Validate Tier selection
const tierSelection = args.tier.toLowerCase();
const validTiers = tierSelection === 'all' ? [1, 2, 3, 4] : [parseInt(tierSelection, 10)];

if (validTiers.some((t) => isNaN(t) || t < 1 || t > 4)) {
  console.error(`\x1b[31mError: Invalid --tier value "${args.tier}". Must be 1, 2, 3, 4, or all.\x1b[0m`);
  process.exit(1);
}

printBanner({
  tiers: validTiers,
  verbose: args.verbose,
  bail: args.bail,
  filter: args.filter
});

// 3. Load test files for the selected tiers
for (const tierNum of validTiers) {
  const tierDir = resolve(__dirname, `tier${tierNum}`);
  if (!existsSync(tierDir)) continue;

  const files = readdirSync(tierDir)
    .filter((f) => f.endsWith('.test.mjs') || f.endsWith('.test.js'))
    .sort();

  for (const file of files) {
    const fullPath = join(tierDir, file);
    harness.setCurrentTier(tierNum);
    harness.setCurrentFile(file);
    await import(pathToFileURL(fullPath).href);
  }
}

// Track current tier to print section headers in standard runner output
let activeTier = null;

// 4. Run harness
const results = await harness.run({
  verbose: args.verbose,
  bail: args.bail,
  filter: args.filter,
  onTestComplete: (testResult, verbose) => {
    if (activeTier !== testResult.tier) {
      activeTier = testResult.tier;
      printTierHeader(activeTier);
    }
    const timeLabel = `\x1b[2m(${testResult.duration.toFixed(0)}ms)\x1b[0m`;
    if (testResult.passed) {
      console.log(`  \x1b[32m✔\x1b[0m ${testResult.name} ${timeLabel}`);
    } else {
      console.log(`  \x1b[31m✖\x1b[0m \x1b[1m${testResult.name}\x1b[0m ${timeLabel}`);
    }
  }
});

// Print tier subtotals
for (const stat of results.tierStats) {
  if (stat.total > 0) {
    printTierSubtotal(stat);
  }
}

// 5. Print failure details if any
if (results.failures.length > 0) {
  printFailures(results.failures);
}

// 6. Print summary table
renderSummaryTable(results.tierStats);

// 7. Exit code: 0 for all pass, 1 if any failed
process.exit(results.grandFail === 0 && results.grandTotal > 0 ? 0 : 1);
