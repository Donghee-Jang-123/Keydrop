export class AudioBus {
  public readonly masterGain: GainNode;
  private readonly ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.masterGain.connect(this.ctx.destination);
  }

  public setMasterVolume(value: number): void {
    this.masterGain.gain.value = value;
  }
}