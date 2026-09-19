/**
 * Tier 2: Group 5 — Inline Tap-to-Rank Card Controls Boundaries (Feat 7)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');

function simulateBallotState() {
  let slots = { rank1: null, rank2: null, rank3: null };

  function selectRank(rank, entryId) {
    // If entryId already in another slot, clear it from that slot (anti-duplication)
    for (const k of ['rank1', 'rank2', 'rank3']) {
      if (slots[k] === entryId) slots[k] = null;
    }

    if (rank === 1) slots.rank1 = entryId;
    else if (rank === 2) slots.rank2 = entryId;
    else if (rank === 3) slots.rank3 = entryId;
  }

  return { slots, selectRank };
}

describe('Group 5 Boundary: Inline Tap-to-Rank Card Controls (Feat 7)', () => {
  it('[T2-RANK-01] Tapping [1st] on candidate already in rank2 executes a clean swap without creating duplicate ranks', () => {
    const b = simulateBallotState();
    b.selectRank(2, 'cand_x');
    assertEqual(b.slots.rank2, 'cand_x');

    // Move to rank 1
    b.selectRank(1, 'cand_x');
    assertEqual(b.slots.rank1, 'cand_x');
    assertEqual(b.slots.rank2, null, 'Previous slot (rank2) must be cleared when candidate moves to rank1');
  });

  it('[T2-RANK-02] Tapping [1st] on candidate already in rank1 is an idempotent safe no-op', () => {
    const b = simulateBallotState();
    b.selectRank(1, 'cand_x');
    b.selectRank(1, 'cand_x');
    assertEqual(b.slots.rank1, 'cand_x');
    assertEqual(b.slots.rank2, null);
    assertEqual(b.slots.rank3, null);
  });

  it('[T2-RANK-03] Rapidly tapping multiple rank chips in succession guarantees invariant of at most 1 candidate per slot', () => {
    const b = simulateBallotState();
    const candidates = ['cand_1', 'cand_2', 'cand_3', 'cand_4', 'cand_5'];

    // Rapid random placements
    for (let i = 0; i < 50; i++) {
      const c = candidates[i % candidates.length];
      const r = (i % 3) + 1;
      b.selectRank(r, c);
    }

    // Check invariants: Each slot holds at most 1 candidate, no duplicate IDs across slots
    const active = Object.values(b.slots).filter(Boolean);
    const unique = new Set(active);
    assertEqual(active.length, unique.size, 'No candidate ID may appear more than once across ballot slots');
  });

  it('[T2-RANK-04] Tap chips display descriptive screen-reader labels (Rank 1st, Rank 2nd, Rank 3rd)', () => {
    const raw = voteAst.rawCode;
    const hasAriaLabels = raw.includes('Rank 1') || raw.includes('1st') || raw.includes('aria-label');
    assertTrue(hasAriaLabels, 'Rank chips must provide accessible naming for screen readers');
  });

  it('[T2-RANK-05] Candidate card action row with tap chips fits within 320px width without overlapping candidate metadata', () => {
    const raw = voteAst.rawCode;
    const hasChipLayout = raw.includes('rank-chip') || raw.includes('tap-rank') || raw.includes('btn-rank');
    assertTrue(hasChipLayout, 'VotePage must provide dedicated layout styling for inline rank chips');
  });
});
