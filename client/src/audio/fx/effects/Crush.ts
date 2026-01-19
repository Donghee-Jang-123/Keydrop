export class CrushEffect {
  public readonly input: GainNode;
  public readonly output: GainNode;

  private readonly preGain: GainNode;
  private readonly postGain: GainNode;

  private readonly shaper: WaveShaperNode;

  private readonly dry: GainNode;
  private readonly wet: GainNode;

  constructor(ctx: AudioContext) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.preGain = ctx.createGain();
    this.postGain = ctx.createGain();

    // 강하게 시작 (티 나게)
    this.preGain.gain.value = 2.5;
    this.postGain.gain.value = 0.7;

    this.shaper = ctx.createWaveShaper();
    this.shaper.oversample = "none";
    this.setAmount(32); // 기본 강하게

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.setMix(0);

    // dry path
    this.input.connect(this.dry);
    this.dry.connect(this.output);

    // wet path
    this.input.connect(this.preGain);
    this.preGain.connect(this.shaper);
    this.shaper.connect(this.postGain);
    this.postGain.connect(this.wet);
    this.wet.connect(this.output);
  }

  public setMix(mix01: number): void {
    const m = Math.max(0, Math.min(1, mix01));
    // mix=1이면 거의 wet만 들리게
    this.wet.gain.value = m;
    this.dry.gain.value = 1 - m;
  }

  /** steps가 클수록 더 “깨짐(양자화)” */
  public setAmount(steps: number): void {
    const s = Math.max(4, Math.min(128, Math.floor(steps)));
    const curve = this.makeQuantizeCurve(s);

    // ✅ TS DOM 타입 이슈 확실 회피
    (this.shaper as unknown as { curve: Float32Array | null }).curve = curve;
  }

  private makeQuantizeCurve(steps: number): Float32Array {
    const n = 44100;
    const curve = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;  // -1..1
      // 양자화
      const y = Math.round(x * steps) / steps;
      // 살짝 더 강하게 클립감(=티)
      curve[i] = Math.max(-1, Math.min(1, y * 1.1));
    }
    return curve;
  }
}