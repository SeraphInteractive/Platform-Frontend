/**
 * Tier 1: Group 11 — Sound & Media Policy Preservation (Feat 10)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';
import { sounds } from '../../src/utils/soundEffects.ts';

const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');

describe('Group 11: Sound & Media Policy Preservation (Feat 10)', () => {
  it('[T1-SND-01] Sound utility exports playPop, playReset, playLevelUp, and playLockIn/playSlot methods', () => {
    assertEqual(typeof sounds.playPop, 'function', 'sounds.playPop must exist');
    assertEqual(typeof sounds.playReset, 'function', 'sounds.playReset must exist');
    assertEqual(typeof sounds.playLevelUp, 'function', 'sounds.playLevelUp must exist');
    assertTrue(
      typeof sounds.playSlot === 'function' || typeof sounds.playLockIn === 'function' || typeof sounds.playClick === 'function',
      'sounds must provide slot/click audio method'
    );
  });

  it('[T1-SND-02] Interacting with tap-to-rank chip triggers audio playback invocation', () => {
    // VotePage must import sounds and call sound playback on slot/chip selection
    const importsSounds = voteAst.findImports().some((i) => i.source.includes('soundEffects'));
    const callsSounds = voteAst.containsPattern(/sounds\.(playPop|playSlot|playClick)/);
    assertTrue(importsSounds && callsSounds, 'VotePage must wire tap-to-rank chip interactions to sounds engine');
  });

  it('[T1-SND-03] Clearing a ballot slot invokes sounds.playReset()', () => {
    const callsReset = voteAst.containsPattern(/sounds\.playReset/);
    assertTrue(callsReset, 'VotePage must call sounds.playReset() when clearing a ballot slot');
  });

  it('[T1-SND-04] Candidate pitch card thumbnail videos include the muted attribute', () => {
    const videos = voteAst.findJsxElements('video');
    const thumbVideo = videos.find((v) => v.attributes.muted !== undefined);
    assertTrue(Boolean(thumbVideo), 'Thumbnail preview video in VotePage must include muted attribute');
  });

  it('[T1-SND-05] Candidate detail modal videos include controls attribute for user playback control', () => {
    const videos = voteAst.findJsxElements('video');
    const detailVideo = videos.find((v) => v.attributes.controls !== undefined);
    assertTrue(Boolean(detailVideo), 'Candidate detail inspection video must provide controls attribute');
  });
});
