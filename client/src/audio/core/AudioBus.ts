export class AudioBus {
  public readonly masterGain: GainNode;
  public readonly streamDest: MediaStreamAudioDestinationNode;
  private readonly ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.masterGain.connect(this.ctx.destination);

    this.streamDest = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.streamDest);
  }

  public setMasterVolume(value: number): void {
    this.masterGain.gain.value = value;
  }

  public getStream(): MediaStream {
    return this.streamDest.stream;
  }
}