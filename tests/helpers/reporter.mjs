/**
 * Formatted Terminal Reporter & Summary Table Generator for vote-ui E2E Runner.
 */

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

export function printBanner({ tiers, verbose, bail, filter }) {
  console.log(`\n${ANSI.bold}${ANSI.cyan}================================================================================${ANSI.reset}`);
  console.log(`  ${ANSI.bold}VOTE-UI E2E TEST RUNNER — HARNESS v1.0.0${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}================================================================================${ANSI.reset}`);
  console.log(`Node: ${process.version} | Mode: Opaque-Box E2E | Target: vote-ui`);
  console.log(`Tiers: [${tiers.join(', ')}] | Verbose: ${verbose} | Bail: ${bail}${filter ? ` | Filter: "${filter}"` : ''}\n`);
}

export function printTierHeader(tierNum) {
  const titles = {
    1: 'TIER 1: FEATURE COVERAGE (HAPPY PATHS)',
    2: 'TIER 2: BOUNDARY & CORNER CASES',
    3: 'TIER 3: CROSS-FEATURE INTERACTIONS (PAIRWISE)',
    4: 'TIER 4: REAL-WORLD SCENARIOS (WORKFLOWS)'
  };
  const title = titles[tierNum] || `TIER ${tierNum}`;
  console.log(`${ANSI.bold}${ANSI.cyan}================================================================================${ANSI.reset}`);
  console.log(`  ${ANSI.bold}${title}${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}================================================================================${ANSI.reset}`);
}

export function printTierSubtotal(tierStat) {
  const pct = tierStat.total > 0 ? Math.round((tierStat.pass / tierStat.total) * 100) : 0;
  const color = tierStat.fail === 0 ? ANSI.green : ANSI.red;
  console.log(
    `  ${color}${ANSI.bold}Tier ${tierStat.tier} Subtotal: ${tierStat.pass}/${tierStat.total} passed (${pct}%), ${tierStat.fail} failed, ${tierStat.timeMs.toFixed(0)}ms${ANSI.reset}\n`
  );
}

export function printFailures(failures) {
  console.log(`\n${ANSI.bold}${ANSI.red}================================================================================${ANSI.reset}`);
  console.log(`  ${ANSI.bold}${ANSI.red}FAILURE DETAILS (${failures.length})${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.red}================================================================================${ANSI.reset}`);

  for (const [idx, f] of failures.entries()) {
    console.log(`\n${ANSI.bold}${ANSI.red}[${idx + 1}] TIER ${f.tier} › ${f.file} › ${f.name}${ANSI.reset}`);
    console.log(`    ${ANSI.red}Error:${ANSI.reset} ${f.error?.message || f.error}`);
    if (f.error?.stack) {
      const cleanStack = f.error.stack
        .split('\n')
        .slice(1)
        .filter((l) => !l.includes('node:internal') && !l.includes('tests/harness.mjs'))
        .slice(0, 4)
        .map((l) => `    ${ANSI.dim}${l.trim()}${ANSI.reset}`)
        .join('\n');
      if (cleanStack) console.log(cleanStack);
    }
  }
}

export function renderSummaryTable(tierStats) {
  console.log(`\n${ANSI.bold}${ANSI.cyan}================================================================================${ANSI.reset}`);
  console.log(`  ${ANSI.bold}TEST SUITE EXECUTION SUMMARY${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}================================================================================${ANSI.reset}`);

  const colWidths = [38, 7, 8, 8, 10];
  const top = `┌${'─'.repeat(colWidths[0] + 2)}┬${'─'.repeat(colWidths[1] + 2)}┬${'─'.repeat(colWidths[2] + 2)}┬${'─'.repeat(colWidths[3] + 2)}┬${'─'.repeat(colWidths[4] + 2)}┐`;
  const mid = `├${'─'.repeat(colWidths[0] + 2)}┼${'─'.repeat(colWidths[1] + 2)}┼${'─'.repeat(colWidths[2] + 2)}┼${'─'.repeat(colWidths[3] + 2)}┼${'─'.repeat(colWidths[4] + 2)}┤`;
  const bot = `└${'─'.repeat(colWidths[0] + 2)}┴${'─'.repeat(colWidths[1] + 2)}┴${'─'.repeat(colWidths[2] + 2)}┴${'─'.repeat(colWidths[3] + 2)}┴${'─'.repeat(colWidths[4] + 2)}┘`;

  console.log(top);
  console.log(
    `│ ${'Coverage Tier'.padEnd(colWidths[0])} │ ${'Total'.padStart(colWidths[1])} │ ${'Passed'.padStart(colWidths[2])} │ ${'Failed'.padStart(colWidths[3])} │ ${'Duration'.padStart(colWidths[4])} │`
  );
  console.log(mid);

  let grandTotal = 0;
  let grandPass = 0;
  let grandFail = 0;
  let grandTime = 0;

  for (const s of tierStats) {
    grandTotal += s.total;
    grandPass += s.pass;
    grandFail += s.fail;
    grandTime += s.timeMs;

    const passStr = s.pass > 0 ? `${ANSI.green}${String(s.pass).padStart(colWidths[2])}${ANSI.reset}` : String(s.pass).padStart(colWidths[2]);
    const failStr = s.fail > 0 ? `${ANSI.red}${ANSI.bold}${String(s.fail).padStart(colWidths[3])}${ANSI.reset}` : String(s.fail).padStart(colWidths[3]);
    const durStr = `${s.timeMs.toFixed(0)}ms`.padStart(colWidths[4]);

    console.log(
      `│ ${s.name.padEnd(colWidths[0])} │ ${String(s.total).padStart(colWidths[1])} │ ${passStr} │ ${failStr} │ ${durStr} │`
    );
  }

  console.log(mid);
  const totalPassStr = `${ANSI.green}${ANSI.bold}${String(grandPass).padStart(colWidths[2])}${ANSI.reset}`;
  const totalFailStr = grandFail > 0 ? `${ANSI.red}${ANSI.bold}${String(grandFail).padStart(colWidths[3])}${ANSI.reset}` : String(grandFail).padStart(colWidths[3]);
  const totalDurStr = `${grandTime.toFixed(0)}ms`.padStart(colWidths[4]);

  console.log(
    `│ ${`${ANSI.bold}Total E2E Suite${ANSI.reset}`.padEnd(colWidths[0] + 8)} │ ${`${ANSI.bold}${grandTotal}${ANSI.reset}`.padStart(colWidths[1] + 8)} │ ${totalPassStr} │ ${totalFailStr} │ ${totalDurStr} │`
  );
  console.log(bot);

  if (grandFail === 0 && grandTotal > 0) {
    console.log(`\n${ANSI.bold}${ANSI.green}Status: ALL TESTS PASSED (Exit Code: 0)${ANSI.reset}\n`);
  } else if (grandFail > 0) {
    console.log(`\n${ANSI.bold}${ANSI.red}Status: TEST SUITE FAILED — ${grandFail} test(s) failed (Exit Code: 1)${ANSI.reset}\n`);
  } else {
    console.log(`\n${ANSI.bold}${ANSI.yellow}Status: NO TESTS EXECUTED${ANSI.reset}\n`);
  }
}
