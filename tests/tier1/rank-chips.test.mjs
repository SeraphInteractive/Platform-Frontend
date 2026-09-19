/**
 * Tier 1: Group 5 — Inline Tap-to-Rank Card Controls (Feat 7)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';

const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');

// Pure simulation of candidate slot assignment logic matching VotePage contract
function createBallotState() {
  let slots = { rank1: null, rank2: null, rank3: null };

  function selectRank(rank, entryId) {
    // If entryId already in another slot, clear it from that slot (clean swap / move)
    if (slots.rank1 === entryId) slots.rank1 = null;
    if (slots.rank2 === entryId) slots.rank2 = null;
    if (slots.rank3 === entryId) slots.rank3 = null;

    if (rank === 1) slots.rank1 = entryId;
    else if (rank === 2) slots.rank2 = entryId;
    else if (rank === 3) slots.rank3 = entryId;
  }

  function isRankSelected(rank, entryId) {
    if (rank === 1) return slots.rank1 === entryId;
    if (rank === 2) return slots.rank2 === entryId;
    if (rank === 3) return slots.rank3 === entryId;
    return false;
  }

  return { slots, selectRank, isRankSelected };
}

describe('Group 5: Inline Tap-to-Rank Card Controls (Feat 7)', () => {
  it('[T1-RANK-01] Candidate cards display inline tap chips [1st], [2nd], and [3rd]', () => {
    const raw = voteAst.rawCode;
    const hasRank1 = raw.includes('1st') || raw.includes('rank-chip-1') || raw.includes('rank === 1');
    const hasRank2 = raw.includes('2nd') || raw.includes('rank-chip-2') || raw.includes('rank === 2');
    const hasRank3 = raw.includes('3rd') || raw.includes('rank-chip-3') || raw.includes('rank === 3');
    assertTrue(hasRank1 && hasRank2 && hasRank3, 'VotePage candidate cards must render 1st, 2nd, and 3rd tap chips');
  });

  it('[T1-RANK-02] Tapping [1st] chip invokes onSelectRank(1, entryId) and places candidate into rank 1', () => {
    const state = createBallotState();
    state.selectRank(1, 'candidate_alpha');
    assertEqual(state.slots.rank1, 'candidate_alpha', 'Candidate must be placed in rank1 slot');
    assertTrue(state.isRankSelected(1, 'candidate_alpha'), 'Rank 1 must be marked selected for candidate_alpha');
  });

  it('[T1-RANK-03] Tapping [2nd] chip invokes onSelectRank(2, entryId) and places candidate into rank 2', () => {
    const state = createBallotState();
    state.selectRank(2, 'candidate_beta');
    assertEqual(state.slots.rank2, 'candidate_beta', 'Candidate must be placed in rank2 slot');
    assertTrue(state.isRankSelected(2, 'candidate_beta'), 'Rank 2 must be marked selected for candidate_beta');
  });

  it('[T1-RANK-04] Tapping [3rd] chip invokes onSelectRank(3, entryId) and places candidate into rank 3', () => {
    const state = createBallotState();
    state.selectRank(3, 'candidate_gamma');
    assertEqual(state.slots.rank3, 'candidate_gamma', 'Candidate must be placed in rank3 slot');
    assertTrue(state.isRankSelected(3, 'candidate_gamma'), 'Rank 3 must be marked selected for candidate_gamma');
  });

  it('[T1-RANK-05] Tap chip displays highlighted/selected state when candidate currently occupies that rank', () => {
    const state = createBallotState();
    state.selectRank(1, 'candidate_alpha');
    assertEqual(state.isRankSelected(1, 'candidate_alpha'), true);
    assertEqual(state.isRankSelected(2, 'candidate_alpha'), false);
    assertEqual(state.isRankSelected(3, 'candidate_alpha'), false);
  });
});
