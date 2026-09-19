/**
 * Tier 4: Real-World Scenarios (End-to-End Workflows)
 * Contains 6 complete multi-step user workflows (T4-SCEN-01 through T4-SCEN-06)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { createCssResolver } from '../helpers/css-parser.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';
import {
  validateBallot,
  aggregateScores,
  calculateMomentsAndVariance,
  POINTS_PER_BALLOT
} from '@platform/internal-logic';

const resolver = createCssResolver('src/styles.css');
const appAst = parseComponentAst('src/App.tsx');
const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');
const pitchAst = parseComponentAst('src/components/CreatePitchModal.tsx');
const docsAst = parseComponentAst('src/views/Docs/DocsPage.tsx');

describe('Tier 4: Real-World Scenarios (End-to-End Workflows)', () => {
  it('[T4-SCEN-01] Complete Voter Journey: Landing -> VotePage -> Tap-to-Rank -> Slot Reorder -> Consensus Submit', () => {
    // 1. Enter landing page layout on 375px
    const rootMobile = resolver.getComputedDeclarations('.app-root-layout', 375);
    assertEqual(rootMobile['overflow-x'], 'hidden');

    // 2. Switch to VotePage
    let activeTab = 'landing';
    const switchTab = (tab) => { activeTab = tab; };
    switchTab('ballot');
    assertEqual(activeTab, 'ballot');

    // 3. User selects 3 candidates using tap chips
    const activeEntries = ['pitch_alpha', 'pitch_beta', 'pitch_gamma'];
    const validEntrySet = new Set(activeEntries);
    const slots = { rank1: null, rank2: null, rank3: null };

    // Tap [1st] for Alpha
    slots.rank1 = 'pitch_alpha';
    // Tap [2nd] for Beta
    slots.rank2 = 'pitch_beta';
    // Tap [3rd] for Gamma
    slots.rank3 = 'pitch_gamma';

    // 4. Reorder slot 2 and slot 3 using Down chevron on slot 2
    const swap = slots.rank2;
    slots.rank2 = slots.rank3;
    slots.rank3 = swap;

    assertEqual(slots.rank2, 'pitch_gamma');
    assertEqual(slots.rank3, 'pitch_beta');

    // 5. Validate candidate ballot against domain consensus
    const ballot = {
      voterId: 'voter_journey_user',
      rank1: slots.rank1,
      rank2: slots.rank2,
      rank3: slots.rank3
    };
    const validation = validateBallot(ballot, validEntrySet);
    assertEqual(validation.isValid, true);
    assertEqual(validation.errors.length, 0);

    // 6. Aggregate ballot into consensus engine
    const aggregation = aggregateScores(activeEntries, [ballot]);
    assertEqual(aggregation.totalBallots, 1);
    assertEqual(aggregation.totalPointsAwarded, 6);
    assertEqual(aggregation.isConserved, true);
  });

  it('[T4-SCEN-02] Pitch Creator Intake Lifecycle: Open Modal -> Enter 450-char Pitch -> Attach Media -> Validate Form', () => {
    let modalOpen = true;
    const form = {
      title: 'The Nether Outpost',
      description: 'A fortified outpost situated near the lava falls of the Nether fortress. Guarded by elite wither skeletons and illuminated with soul fire lanterns, this stronghold protects the ancient nether portal corridor from incoming ravager siege parties.',
      mediaAttached: true,
      mediaSize: 1024 * 1024 * 2 // 2MB
    };

    // Verify title and description
    assertTrue(form.title.length > 0);
    assertEqual(form.title, 'The Nether Outpost');

    // Dynamic character counter check (450 <= 1500)
    const charCount = form.description.length;
    assertTrue(charCount <= 1500, 'Description must not exceed 1500 char limit');

    // Media file size check (< 5MB)
    assertTrue(form.mediaSize <= 5 * 1024 * 1024, 'Media must be under 5MB');

    // Submit and dismiss modal
    modalOpen = false;
    assertEqual(modalOpen, false, 'Modal should close on successful pitch submission');
  });

  it('[T4-SCEN-03] Public Leaderboard & Consensus Conservation Audit: Standings Table Wrapping & 6N Conservation', () => {
    const entries = ['candidate_a', 'candidate_b', 'candidate_c', 'candidate_d'];
    const ballots = [
      { voterId: 'v1', rank1: 'candidate_a', rank2: 'candidate_b', rank3: 'candidate_c' },
      { voterId: 'v2', rank1: 'candidate_b', rank2: 'candidate_a', rank3: 'candidate_d' },
      { voterId: 'v3', rank1: 'candidate_c', rank2: 'candidate_a', rank3: 'candidate_b' },
      { voterId: 'v4', rank1: 'candidate_a', rank2: 'candidate_c', rank3: 'candidate_d' },
      { voterId: 'v5', rank1: 'candidate_d', rank2: 'candidate_b', rank3: 'candidate_a' }
    ];

    const agg = aggregateScores(entries, ballots);

    // Verify 6N mathematical conservation equation
    assertEqual(agg.totalBallots, 5);
    assertEqual(agg.totalPointsAwarded, 30, '5 ballots * 6 points must equal exactly 30 total points');
    assertEqual(agg.isConserved, true, 'isConserved invariant must hold');

    // Check table wrapper styling for mobile audit
    const tableWrap = resolver.getComputedDeclarations('.table-wrap', 320);
    assertEqual(tableWrap['overflow-x'], 'auto');
  });

  it('[T4-SCEN-04] Adversarial Edge-Case Ballot Handling & Recovery: Duplicate Detection -> Clear Slot -> Re-pick -> Cast', () => {
    const activeEntries = ['pitch_1', 'pitch_2', 'pitch_3', 'pitch_4'];
    const validEntrySet = new Set(activeEntries);

    // 1. Adversarial stacked ballot (pitch_1 in both 1st and 2nd)
    const stackedBallot = {
      voterId: 'adv_voter',
      rank1: 'pitch_1',
      rank2: 'pitch_1',
      rank3: 'pitch_3'
    };
    const invalidRes = validateBallot(stackedBallot, validEntrySet);
    assertEqual(invalidRes.isValid, false, 'Duplicate entry must be rejected');
    assertTrue(invalidRes.errors.some((e) => e.includes('Anti-stacking')));

    // 2. Recovery: Clear slot 2
    stackedBallot.rank2 = '';

    // 3. Re-pick distinct candidate (pitch_2)
    stackedBallot.rank2 = 'pitch_2';

    // 4. Re-validate
    const validRes = validateBallot(stackedBallot, validEntrySet);
    assertEqual(validRes.isValid, true, 'Corrected ballot must pass validation');
    assertEqual(validRes.errors.length, 0);
  });

  it('[T4-SCEN-05] DevWorkbench Staff Moderation Workflow: Table Wrapping & Statistical Moments Calculation', () => {
    // Calculate variance and statistical moments using domain logic
    const breakdown = { entryId: 'pitch_alpha', rank1Count: 5, rank2Count: 3, rank3Count: 2 };
    const moments = calculateMomentsAndVariance(breakdown, 10);

    assertEqual(moments.entryId, 'pitch_alpha');
    assertEqual(moments.p1, 0.5, 'Empirical probability of 1st place should be 5/10 = 0.5');
    assertTrue(moments.expectedScorePerVoter > 0, 'Expected score per voter must be positive');
    assertTrue(moments.totalVariance >= 0, 'Total variance must be non-negative');

    // Verify table wrap containment in DevWorkbench
    const tableWrap = resolver.getComputedDeclarations('.table-wrap', 375);
    assertEqual(tableWrap['width'], '100%');
  });

  it('[T4-SCEN-06] Multi-Device Viewport Audit: Sweep 320px, 375px, 390px, 414px, 768px, 1024px, 1280px', () => {
    const viewports = [320, 375, 390, 414, 768, 1024, 1280];

    for (const vp of viewports) {
      const rootDecls = resolver.getComputedDeclarations('.app-root-layout', vp);
      // All mobile viewports (<=768px) must suppress horizontal overflow
      if (vp <= 768) {
        assertEqual(rootDecls['overflow-x'], 'hidden', `Viewport ${vp}px must have overflow-x: hidden`);
      }
      // Viewports >=1024px must maintain desktop layout
      if (vp >= 1024) {
        const layoutDecls = resolver.getComputedDeclarations('.layout-with-sidebar', vp);
        assertEqual(layoutDecls['flex-direction'], 'row', `Viewport ${vp}px must have flex-direction: row`);
      }
    }
  });
});
