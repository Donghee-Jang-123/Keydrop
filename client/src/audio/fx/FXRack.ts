import { CrushEffect } from "./effects/Crush";
import { FlangerEffect } from "./effects/Flanger";
import { SlicerEffect } from "./effects/Slicer";
import { KickEffect } from "./effects/Kick";

export type FXType = "crush" | "flanger" | "slicer" | "kick";

export class FXRack {
  public readonly input: GainNode;
  public readonly output: GainNode;

  public readonly crush: CrushEffect;
  public readonly flanger: FlangerEffect;
  public readonly slicer: SlicerEffect;
  public readonly kick: KickEffect;

  constructor(ctx: AudioContext) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();

    this.crush = new CrushEffect(ctx);
    this.flanger = new FlangerEffect(ctx);
    this.slicer = new SlicerEffect(ctx);
    this.kick = new KickEffect(ctx);

    // 체인: input -> crush -> flanger -> slicer -> kick -> output
    this.input.connect(this.crush.input);
    this.crush.output.connect(this.flanger.input);
    this.flanger.output.connect(this.slicer.input);
    this.slicer.output.connect(this.kick.input);
    this.kick.output.connect(this.output);

    // 기본은 전부 dry(=mix 0)
    this.crush.setMix(0);
    this.flanger.setMix(0);
    this.slicer.setMix(0);
    // kick은 트리거형이라 mix 개념 없음
  }

  /** hold를 못 쓰니, 테스트 페이지에서는 토글로 on/off */
  public setEnabled(type: FXType, enabled: boolean): void {
    const m = enabled ? 1 : 0;

    if (type === "crush") this.crush.setMix(m);
    if (type === "flanger") this.flanger.setMix(m);
    if (type === "slicer") this.slicer.setMix(m);
    if (type === "kick") this.kick.setMix(m);
  }

}