/**
 * Tier 2: Group 12 — Consensus Logic & Build Integrity Boundaries (Feat 1, 11, 24, 25, 26)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { validateBallot } from '@platform/internal-logic';

const validSet = new Set(['pitch-1', 'pitch-2', 'pitch-3', 'pitch-4']);

describe('Group 12 Boundary: Consensus Logic & Build Integrity (Feat 1, 11, 24, 25, 26)', () => {
  it('[T2-LOG-01] validateBallot rejects ballot with empty or whitespace-only voterId', () => {
    const invalidBallot = {
      voterId: '   ',
      rank1: 'pitch-1',
      rank2: 'pitch-2',
      rank3: 'pitch-3'
    };
    const res = validateBallot(invalidBallot, validSet);
    assertEqual(res.isValid, false, 'Ballot with whitespace voterId must be rejected');
    assertTrue(res.errors.some((e) => e.includes('voterId') || e.includes('Missing voterId')),
      'Must report voterId error');
  });

  it('[T2-LOG-02] validateBallot rejects ballot missing any slot (e.g. rank3 empty)', () => {
    const incompleteBallot = {
      voterId: 'voter_bob',
      rank1: 'pitch-1',
      rank2: 'pitch-2',
      rank3: ''
    };
    const res = validateBallot(incompleteBallot, validSet);
    assertEqual(res.isValid, false, 'Ballot missing rank3 must be rejected');
    assertTrue(res.errors.some((e) => e.includes('empty') || e.includes('3rd place')),
      'Must report empty 3rd place slot error');
  });

  it('[T2-LOG-03] validateBallot enforces anti-stacking and rejects ballot where rank1 === rank2', () => {
    const stackedBallot = {
      voterId: 'voter_charlie',
      rank1: 'pitch-1',
      rank2: 'pitch-1',
      rank3: 'pitch-3'
    };
    const res = validateBallot(stackedBallot, validSet);
    assertEqual(res.isValid, false, 'Ballot with duplicate candidates must be rejected');
    assertTrue(res.errors.some((e) => e.includes('Anti-stacking') || e.includes('different')),
      'Must report anti-stacking violation');
  });

  it('[T2-LOG-04] validateBallot rejects ballot where candidate ID is not in active round validEntrySet', () => {
    const foreignBallot = {
      voterId: 'voter_dave',
      rank1: 'pitch-1',
      rank2: 'pitch-2',
      rank3: 'unregistered-pitch-xyz'
    };
    const res = validateBallot(foreignBallot, validSet);
    assertEqual(res.isValid, false, 'Ballot with foreign candidate ID must be rejected');
    assertTrue(res.errors.some((e) => e.includes('not in the active') || e.includes('active entries') || e.includes('active catalog')),
      'Must report candidate not in active catalog error');
  });

  it('[T2-LOG-05] Full production bundle npm run build completes with 0 errors and generates dist/ bundle', () => {
    try {
      const output = execSync('npm run build', { stdio: 'pipe', encoding: 'utf8' });
      assertTrue(output.includes('built in'), 'Build output should report success');
      assertTrue(fs.existsSync('dist/index.html'), 'dist/index.html must exist after production build');
    } catch (err) {
      throw new Error(`Production build failed:\n${err.stdout || err.stderr || err.message}`);
    }
  });
});
