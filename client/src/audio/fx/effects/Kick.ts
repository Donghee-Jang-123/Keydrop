export class KickEffect {
  public readonly input: GainNode;
  public readonly output: GainNode;

  private readonly ctx: AudioContext;

  private readonly pumpGain: GainNode;
  private readonly dry: GainNode;
  private readonly wet: GainNode;

  private intervalId: number | null = null;

  private bpm = 120;
  private depth = 0.9;      // ✅ 과장
  private attackMs = 3;     // ✅ 빠르게 꺼짐
  private releaseMs = 260;  // ✅ 느리게 복구 (펌핑)

  constructor(ctx: AudioContext) {
    this.ctx = ctx;

    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.pumpGain = ctx.createGain();
    this.pumpGain.gain.value = 1.0;

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.setMix(0);

    // dry
    this.input.connect(this.dry);
    this.dry.connect(this.output);

    // wet (pumping)
    this.input.connect(this.pumpGain);
    this.pumpGain.connect(this.wet);
    this.wet.connect(this.output);
  }

  public setMix(mix01: number): void {
    const m = Math.max(0, Math.min(1, mix01));
    this.wet.gain.value = m;
    this.dry.gain.value = 1 - m;

    if (m === 0) this.stopPumping();
    else this.startPumping();
  }

  public setBpm(bpm: number): void {
    this.bpm = Math.max(40, Math.min(240, bpm));
    if (this.intervalId !== null) {
      this.stopPumping();
      this.startPumping();
    }
  }
  public setDepth(depth01: number): void {
    this.depth = Math.max(0, Math.min(0.95, depth01));
  }
  public setAttackMs(ms: number): void {
    this.attackMs = Math.max(1, Math.min(80, ms));
  }
  public setReleaseMs(ms: number): void {
    this.releaseMs = Math.max(20, Math.min(800, ms));
  }

  private startPumping(): void {
    if (this.intervalId !== null) return;

    const periodMs = 60_000 / this.bpm;
    this.intervalId = window.setInterval(() => this.pumpOnce(), periodMs);
    this.pumpOnce();
  }

  private stopPumping(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const now = this.ctx.currentTime;
    this.pumpGain.gain.cancelScheduledValues(now);
    this.pumpGain.gain.setValueAtTime(this.pumpGain.gain.value, now);
    this.pumpGain.gain.linearRampToValueAtTime(1.0, now + 0.03);
  }

  private pumpOnce(): void {
    const now = this.ctx.currentTime;

    this.pumpGain.gain.cancelScheduledValues(now);
    this.pumpGain.gain.setValueAtTime(this.pumpGain.gain.value, now);

    const duckTo = 1.0 - this.depth;
    const attackSec = this.attackMs / 1000;
    const releaseSec = this.releaseMs / 1000;

    this.pumpGain.gain.linearRampToValueAtTime(duckTo, now + attackSec);
    this.pumpGain.gain.linearRampToValueAtTime(1.0, now + attackSec + releaseSec);
  }
}