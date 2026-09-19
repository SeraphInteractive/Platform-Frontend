/**
 * Tier 1: Group 12 — Consensus Logic & Build Integrity (Feat 1, 11, 24-26)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import {
  validateBallot,
  RANK_WEIGHTS,
  POINTS_PER_BALLOT
} from '@platform/internal-logic';

describe('Group 12: Consensus Logic & Build Integrity (Feat 1, 11, 24-26)', () => {
  it('[T1-LOG-01] package.json specifies "typecheck": "tsc --noEmit" in scripts', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    assertEqual(pkg.scripts?.typecheck, 'tsc --noEmit', 'package.json must declare typecheck script');
  });

  it('[T1-LOG-02] validateBallot returns { isValid: true, errors: [] } for a valid 3-candidate ballot', () => {
    const validBallot = {
      voterId: 'voter_alice',
      rank1: 'candidate_1',
      rank2: 'candidate_2',
      rank3: 'candidate_3'
    };
    const validSet = new Set(['candidate_1', 'candidate_2', 'candidate_3']);
    const result = validateBallot(validBallot, validSet);
    assertEqual(result.isValid, true, 'Valid ballot must pass validation');
    assertEqual(result.errors.length, 0, 'Valid ballot must have no error messages');
  });

  it('[T1-LOG-03] RANK_WEIGHTS maps rank 1 to 3 pts, rank 2 to 2 pts, rank 3 to 1 pt', () => {
    assertEqual(RANK_WEIGHTS[1], 3, 'Rank 1 must award 3 points');
    assertEqual(RANK_WEIGHTS[2], 2, 'Rank 2 must award 2 points');
    assertEqual(RANK_WEIGHTS[3], 1, 'Rank 3 must award 1 point');
  });

  it('[T1-LOG-04] Total points per ballot equals exactly 6 (POINTS_PER_BALLOT = 6)', () => {
    assertEqual(POINTS_PER_BALLOT, 6, 'POINTS_PER_BALLOT must equal exactly 6');
    const sum = RANK_WEIGHTS[1] + RANK_WEIGHTS[2] + RANK_WEIGHTS[3];
    assertEqual(sum, POINTS_PER_BALLOT, 'Sum of rank weights must equal POINTS_PER_BALLOT');
  });

  it('[T1-LOG-05] TypeScript typechecking completes with 0 errors (tsc --noEmit)', () => {
    try {
      const output = execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf8' });
      assertEqual(output.trim(), '', 'Typecheck output should be clean');
    } catch (err) {
      throw new Error(`TypeScript typecheck failed:\n${err.stdout || err.stderr || err.message}`);
    }
  });
});
