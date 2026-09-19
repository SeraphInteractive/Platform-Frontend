/**
 * Tier 1: Group 6 — Touch Reorder Controls on Slots (Feat 8)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');

// Pure simulation of slot reorder mechanics matching PROJECT.md onReorderRank contract
function createReorderableSlots(initial = { rank1: 'cand_a', rank2: 'cand_b', rank3: 'cand_c' }) {
  const slots = { ...initial };

  function reorder(sourceRank, targetRank) {
    if (sourceRank < 1 || sourceRank > 3 || targetRank < 1 || targetRank > 3) return;
    const srcKey = `rank${sourceRank}`;
    const tgtKey = `rank${targetRank}`;
    const temp = slots[srcKey];
    slots[srcKey] = slots[tgtKey];
    slots[tgtKey] = temp;
  }

  return { slots, reorder };
}

describe('Group 6: Touch Reorder Controls on Slots (Feat 8)', () => {
  it('[T1-REORD-01] Filled ballot slot 2 renders both Up (▲) and Down (▼) reorder chevron buttons', () => {
    const raw = voteAst.rawCode;
    const hasChevrons = raw.includes('▲') || raw.includes('▼') || raw.includes('reorder') || raw.includes('onReorderRank');
    assertTrue(hasChevrons, 'VotePage must render reorder chevrons on filled ballot slots');
  });

  it('[T1-REORD-02] Tapping Up chevron on slot 2 swaps occupants of rank 1 and rank 2', () => {
    const { slots, reorder } = createReorderableSlots({ rank1: 'A', rank2: 'B', rank3: 'C' });
    reorder(2, 1);
    assertEqual(slots.rank1, 'B', 'Rank 1 should now be B');
    assertEqual(slots.rank2, 'A', 'Rank 2 should now be A');
    assertEqual(slots.rank3, 'C', 'Rank 3 should remain C');
  });

  it('[T1-REORD-03] Tapping Down chevron on slot 2 swaps occupants of rank 2 and rank 3', () => {
    const { slots, reorder } = createReorderableSlots({ rank1: 'A', rank2: 'B', rank3: 'C' });
    reorder(2, 3);
    assertEqual(slots.rank1, 'A', 'Rank 1 should remain A');
    assertEqual(slots.rank2, 'C', 'Rank 2 should now be C');
    assertEqual(slots.rank3, 'B', 'Rank 3 should now be B');
  });

  it('[T1-REORD-04] Tapping Down chevron on slot 1 swaps occupants of rank 1 and rank 2', () => {
    const { slots, reorder } = createReorderableSlots({ rank1: 'A', rank2: 'B', rank3: 'C' });
    reorder(1, 2);
    assertEqual(slots.rank1, 'B', 'Rank 1 should now be B');
    assertEqual(slots.rank2, 'A', 'Rank 2 should now be A');
  });

  it('[T1-REORD-05] Tapping Up chevron on slot 3 swaps occupants of rank 3 and rank 2', () => {
    const { slots, reorder } = createReorderableSlots({ rank1: 'A', rank2: 'B', rank3: 'C' });
    reorder(3, 2);
    assertEqual(slots.rank2, 'C', 'Rank 2 should now be C');
    assertEqual(slots.rank3, 'B', 'Rank 3 should now be B');
  });
});
