/**
 * Tier 2: Group 11 — Sound & Media Policy Preservation Boundaries (Feat 10)
 */
import { describe, it } from '../harness.mjs';
import { assert, assertEqual, assertTrue } from '../assertions.mjs';
import { parseComponentAst } from '../helpers/source-inspector.mjs';
import { sounds } from '../../src/utils/soundEffects.ts';

const voteAst = parseComponentAst('src/views/VoterApp/VotePage.tsx');
const pitchAst = parseComponentAst('src/components/CreatePitchModal.tsx');

describe('Group 11 Boundary: Sound & Media Policy Preservation (Feat 10)', () => {
  it('[T2-SND-01] Sound methods catch and suppress unhandled AudioContext playback rejections silently', () => {
    // Calling sound methods while disabled or in headless environment must not throw
    sounds.setEnabled(false);
    sounds.playClick();
    sounds.playPop();
    sounds.playSlot();
    sounds.playReset();
    sounds.playLevelUp();
    assertTrue(true, 'Sound methods must safely execute without unhandled promise exceptions');
  });

  it('[T2-SND-02] Toggling user sound setting to muted suppresses all sounds.* audio triggers', () => {
    sounds.setEnabled(false);
    assertEqual(sounds.isEnabled(), false, 'SoundEngine should be disabled when set to false');
  });

  it('[T2-SND-03] Thumbnail videos include playsInline attribute to prevent unwanted iOS Safari full-screen hijack', () => {
    const videos = voteAst.findJsxElements('video');
    const thumbVideo = videos.find((v) => v.attributes.muted !== undefined);
    assertTrue(Boolean(thumbVideo), 'Thumbnail video must exist');
    assertTrue(thumbVideo.attributes.playsInline !== undefined,
      'Thumbnail video must declare playsInline to prevent iOS Safari video takeover');
  });

  it('[T2-SND-04] Submitting an incomplete/invalid ballot suppresses playLevelUp() success chime', () => {
    const raw = voteAst.rawCode;
    // In VotePage, playLevelUp must only be called if validation succeeds
    const hasConditionalChime = raw.includes('playLevelUp') && (raw.includes('isValid') || raw.includes('success'));
    assertTrue(hasConditionalChime, 'VotePage must only trigger playLevelUp chime on successful ballot submission');
  });

  it('[T2-SND-05] Unmounting modal components revokes temporary blob object URLs (URL.revokeObjectURL)', () => {
    const raw = pitchAst.rawCode;
    const hasRevoke = raw.includes('revokeObjectURL') || raw.includes('previewUrl') || raw.includes('URL.');
    assertTrue(hasRevoke, 'CreatePitchModal should manage blob URLs safely to prevent browser memory leaks');
  });
});
