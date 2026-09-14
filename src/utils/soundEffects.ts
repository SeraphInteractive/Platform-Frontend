// Sound engine disabled for UI interactions - audio playback is reserved exclusively for video players

class SoundEngine {
  public setEnabled(_enabled: boolean): void {}
  public isEnabled(): boolean {
    return false;
  }
  public playClick(): void {}
  public playSlot(): void {}
  public playPop(): void {}
  public playLevelUp(): void {}
  public playWhoosh(): void {}
  public playReset(): void {}
}

export const sounds = new SoundEngine();

