export class SlicerEffect {
  public readonly input: GainNode;
  public readonly output: GainNode;

  private readonly gate: GainNode;

  private readonly dry: GainNode;
  private readonly wet: GainNode;

  private readonly lfo: OscillatorNode;
  private readonly lfoGain: GainNode;
  private readonly bias: ConstantSourceNode;

  constructor(ctx: AudioContext) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.gate = ctx.createGain();
    this.gate.gain.value = 1;

    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.setMix(0);

    // square LFO: 0/1 게이트
    this.lfo = ctx.createOscillator();
    this.lfo.type = "square";
    this.lfo.frequency.value = 10; // ✅ 기본부터 티나게

    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 0.5;

    this.bias = ctx.createConstantSource();
    this.bias.offset.value = 0.5;

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.gate.gain);
    this.bias.connect(this.gate.gain);

    this.lfo.start();
    this.bias.start();

    // dry
    this.input.connect(this.dry);
    this.dry.connect(this.output);

    // wet (gated)
    this.input.connect(this.gate);
    this.gate.connect(this.wet);
    this.wet.connect(this.output);
  }

  public setMix(mix01: number): void {
    const m = Math.max(0, Math.min(1, mix01));
    this.wet.gain.value = m;
    this.dry.gain.value = 1 - m;
  }

  public setRate(hz: number): void {
    this.lfo.frequency.value = Math.max(0.5, Math.min(24, hz));
  }
}