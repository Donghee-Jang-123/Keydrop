export class FlangerEffect {
  public readonly input: GainNode;
  public readonly output: GainNode;

  private readonly delay: DelayNode;
  private readonly feedback: GainNode;

  private readonly dry: GainNode;
  private readonly wet: GainNode;

  private readonly lfo: OscillatorNode;
  private readonly lfoGain: GainNode;

  constructor(ctx: AudioContext) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    // 0~20ms 정도 범위가 플랜저 핵심
    this.delay = ctx.createDelay(0.05);
    this.delay.delayTime.value = 0.004; // base 4ms

    this.feedback = ctx.createGain();
    this.feedback.gain.value = 0.75; // ✅ 강하게 (티)

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.setMix(0);

    // LFO
    this.lfo = ctx.createOscillator();
    this.lfo.type = "sine";
    this.lfo.frequency.value = 0.35; // 느긋한 제트기
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.008; // ✅ 깊이(8ms) 티남

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delay.delayTime);
    this.lfo.start();

    // dry path
    this.input.connect(this.dry);
    this.dry.connect(this.output);

    // wet path
    this.input.connect(this.delay);
    this.delay.connect(this.wet);
    this.wet.connect(this.output);

    // feedback loop
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
  }

  public setMix(mix01: number): void {
    const m = Math.max(0, Math.min(1, mix01));
    this.wet.gain.value = m;
    this.dry.gain.value = 1 - m;
  }

  public setRate(hz: number): void {
    this.lfo.frequency.value = Math.max(0.05, Math.min(5, hz));
  }

  /** depth seconds (0.001~0.012 권장) */
  public setDepth(sec: number): void {
    this.lfoGain.gain.value = Math.max(0.001, Math.min(0.012, sec));
  }

  public setFeedback(value01: number): void {
    this.feedback.gain.value = Math.max(0, Math.min(0.95, value01));
  }
}