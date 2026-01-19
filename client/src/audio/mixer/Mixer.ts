export class Mixer {
  private readonly deck1Gain: GainNode;
  private readonly deck2Gain: GainNode;

  constructor(ctx: AudioContext) {
    this.deck1Gain = ctx.createGain();
    this.deck2Gain = ctx.createGain();
    this.setCrossfader(0);
  }

  public connectDeck1(deckOutput: AudioNode): void {
    deckOutput.connect(this.deck1Gain);
  }

  public connectDeck2(deckOutput: AudioNode): void {
    deckOutput.connect(this.deck2Gain);
  }

  public connectTo(destination: AudioNode): void {
    this.deck1Gain.connect(destination);
    this.deck2Gain.connect(destination);
  }

  /** -1(왼쪽=Deck1) ~ +1(오른쪽=Deck2) */
  public setCrossfader(value: number): void {
    const x = Math.max(-1, Math.min(1, value));

    // equal power curve
    // x=-1 -> A=1 B=0
    // x=+1 -> A=0 B=1
    const t = (x + 1) / 2; // 0..1
    const gainA = Math.cos(t * Math.PI * 0.5);
    const gainB = Math.sin(t * Math.PI * 0.5);

    this.deck1Gain.gain.value = gainA;
    this.deck2Gain.gain.value = gainB;
  }
}