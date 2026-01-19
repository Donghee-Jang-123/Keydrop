import type { CueIndex, DeckId, DeckState } from "./type";

export class Deck {
  public readonly id: DeckId;
  private readonly ctx: AudioContext;

  private readonly bassNode: BiquadFilterNode;   // low-shelf
  private readonly midNode: BiquadFilterNode;    // peaking
  private readonly filterNode: BiquadFilterNode; // lowpass
  private readonly faderNode: GainNode;          // volume

  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;

  private isPlaying = false;

  private startedAt = 0;   // ctx.currentTime
  private offsetSec = 0;   // accumulated offset

  private cues = new Map<CueIndex, number>();

  private reverseBuffer: AudioBuffer | null = null;
  private scratchGain!: GainNode;
  private scratchTimer: number | null = null;

  private scratchHoldTimer: number | null = null;
  private scratchHoldWasPlaying = false;
  private scratchHoldBasePos = 0;
  private scratchHoldDir: 1 | -1 = 1;

  constructor(ctx: AudioContext, id: DeckId) {
    this.ctx = ctx;
    this.id = id;

    this.bassNode = ctx.createBiquadFilter();
    this.bassNode.type = "lowshelf";
    this.bassNode.frequency.value = 120;
    this.bassNode.gain.value = 0;

    this.midNode = ctx.createBiquadFilter();
    this.midNode.type = "peaking";
    this.midNode.frequency.value = 1000;
    this.midNode.Q.value = 1;
    this.midNode.gain.value = 0;

    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.value = 20000; // 기본은 거의 풀 오픈
    this.filterNode.Q.value = 0.7;

    this.faderNode = ctx.createGain();
    this.faderNode.gain.value = 0.9;
    
    this.scratchGain = ctx.createGain();
    this.scratchGain.gain.value = 1.0;
    this.scratchGain.connect(this.output);

    this.bassNode.connect(this.midNode);
    this.midNode.connect(this.filterNode);
    this.filterNode.connect(this.faderNode);
  }

  public get output(): AudioNode {
    return this.faderNode;
  }

  public load(buffer: AudioBuffer): void {
    this.stopScratchHold();
    this.stop(true);
    this.buffer = buffer;
    this.offsetSec = 0;
    this.cues.clear();
    this.reverseBuffer = this.makeReversedBuffer(buffer);
  }

  private getDurationSec(): number {
    return this.buffer?.duration ?? 0;
  }

  public getPositionSec(): number {
    if (!this.buffer) return 0;
    if (!this.isPlaying) return Math.max(0, Math.min(this.offsetSec, this.buffer.duration));


    const elapsed = this.ctx.currentTime - this.startedAt;
    return Math.max(0, Math.min(this.offsetSec + elapsed, this.buffer.duration));
  }

  private startSourceAt(offsetSec: number): void {
    if (!this.buffer) throw new Error(`Deck${this.id}: no buffer loaded`);

    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.connect(this.bassNode);

    this.startedAt = this.ctx.currentTime;
    this.offsetSec = Math.max(0, Math.min(offsetSec, this.buffer.duration));
    src.start(0, this.offsetSec);

    src.onended = () => {
      // 자연 종료 or stop 호출 모두 포함 가능
      if (this.source === src) {
        this.isPlaying = false;
        this.source = null;
        this.offsetSec = 0;
      }
    };

    this.source = src;
    this.isPlaying = true;
  }

  private stopSource(): void {
    if (!this.source) return;
    try {
      this.source.stop();
    } catch {
      // ignore
    }
    this.source = null;
  }

  public getBuffer(): AudioBuffer | null {
    return this.buffer;
  }

  public startScratchHold(options?: {
    grainMs?: number;    // 한 조각 길이(40~90)
    jumpMs?: number;     // 반복 간격(20~60)
    intensity?: number;  // 0..1 (더 과격)
  }): void {
    if (!this.buffer || !this.reverseBuffer) return;

    // 이미 홀드 스크래치 중이면 중복 시작 방지
    if (this.scratchHoldTimer !== null) return;

    const grainMs = options?.grainMs ?? 45;
    const jumpMs = options?.jumpMs ?? 22;
    const intensity = options?.intensity ?? 1.0;

    this.scratchHoldWasPlaying = this.isPlaying;
    this.scratchHoldBasePos = this.getPositionSec();
    this.scratchHoldDir = 1;

    // 재생 중이면 멈추고 스크래치만 들리게
    if (this.scratchHoldWasPlaying) this.stop(false);

    const grainSec = grainMs / 1000;
    const fadeSec = Math.min(0.015, grainSec * 0.3);
    const maxOffset = 0.12 * intensity; // ✅ 왕복 폭(초). 너무 크면 불쾌하니 0.08~0.18 사이 추천

    this.scratchHoldTimer = window.setInterval(() => {
      if (!this.buffer || !this.reverseBuffer) return;

      // base를 중심으로 +, -로 왔다갔다
      const target = Math.max(
        0,
        Math.min(this.buffer.duration - grainSec, this.scratchHoldBasePos + this.scratchHoldDir * maxOffset)
      );

      this.playGrain(this.scratchHoldDir, target, grainSec, fadeSec);

      // 방향 전환
      this.scratchHoldDir = (this.scratchHoldDir === 1 ? -1 : 1);
    }, jumpMs);
  }

  public stopScratchHold(): void {
    if (this.scratchHoldTimer !== null) {
      window.clearInterval(this.scratchHoldTimer);
      this.scratchHoldTimer = null;
    }

    // 원래 위치로 복귀
    if (this.buffer) {
      this.seek(this.scratchHoldBasePos);
    }

    // 원래 재생 중이었으면 다시 재생
    if (this.scratchHoldWasPlaying) {
      try {
        this.play();
      } catch {
        // ignore
      }
    }

    this.scratchHoldWasPlaying = false;
  }


  private makeReversedBuffer(buffer: AudioBuffer): AudioBuffer {
  const rev = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = rev.getChannelData(ch);
    for (let i = 0, j = src.length - 1; i < src.length; i++, j--) {
      dst[i] = src[j];
    }
  }
  return rev;
}

  public play(): void {
    if (!this.buffer) return;
    if (this.isPlaying) return;
    this.startSourceAt(this.offsetSec);
  }

  public stop(hardReset = false): void {
    if (!this.buffer) return;

    if (this.isPlaying) {
      // 누적 offset 업데이트
      const pos = this.getPositionSec();
      this.offsetSec = pos;
    }

    this.stopSource();
    this.isPlaying = false;

    if (hardReset) {
      this.offsetSec = 0;
    }
  }

  public toggle(): void {
    if (this.isPlaying) this.stop(false);
    else this.play();
  }

  /** 재생 중에도 안전한 seek (재시작 방식) */
  public seek(sec: number): void {
    if (!this.buffer) return;
    const target = Math.max(0, Math.min(sec, this.buffer.duration));

    if (!this.isPlaying) {
      this.offsetSec = target;
      return;
    }

    // playing 중이면 재시작
    this.stopSource();
    this.startSourceAt(target);
  }

  // ------------------ cues ------------------
  public setCue(index: CueIndex): void {
    const pos = this.getPositionSec();
    this.cues.set(index, pos);
  }

  public jumpCue(index: CueIndex): void {
    const pos = this.cues.get(index);
    if (pos === undefined) return;
    this.seek(pos);
  }

  // ------------------ EQ/Filter/Fader ------------------
  public setFader(value01: number): void {
    const v = Math.max(0, Math.min(value01, 1));
    this.faderNode.gain.value = v;
  }

  public setBassGainDb(db: number): void {
    this.bassNode.gain.value = db;
  }

  public setMidGainDb(db: number): void {
    this.midNode.gain.value = db;
  }

  public setFilterValue(value01: number): void {
    const v = Math.max(0, Math.min(value01, 1));
    const minHz = 80;
    const maxHz = 20000;
    const freq = minHz * Math.pow(maxHz / minHz, v);
    this.filterNode.frequency.value = freq;
  }

  public getState(): DeckState {
    return {
      isPlaying: this.isPlaying,
      durationSec: this.getDurationSec(),
      positionSec: this.getPositionSec(),
      cues: {
        1: this.cues.get(1),
        2: this.cues.get(2),
      },
    };
  }

public scratchBurst(options?: {
  bursts?: number;        // 왕복 횟수(많을수록 스크래치 길어짐)
  grainMs?: number;       // 한 조각 길이(40~90)
  jumpMs?: number;        // 다음 조각까지 간격(20~60)
  intensity?: number;     // 0..1 (크면 더 과격)
}): void {
  if (!this.buffer || !this.reverseBuffer) return;

  const bursts = options?.bursts ?? 18;
  const grainMs = options?.grainMs ?? 45;
  const jumpMs = options?.jumpMs ?? 22;
  const intensity = options?.intensity ?? 1.0;

  const wasPlaying = this.isPlaying;
  const base = this.getPositionSec();

  // 재생 중이면 멈추고 "스크래치 소리"만 들리게
  if (wasPlaying) this.stop(false);

  // 혹시 이전 스크래치 타이머 돌고 있으면 종료
  if (this.scratchTimer !== null) {
    window.clearInterval(this.scratchTimer);
    this.scratchTimer = null;
  }

  const grainSec = grainMs / 1000;
  const fadeSec = Math.min(0.015, grainSec * 0.3); // 클릭 방지 페이드
  const maxOffset = 10 * intensity;              // 최대 움직임(초)

  let i = 0;
  this.scratchTimer = window.setInterval(() => {
    const dir = i % 2 === 0 ? 1 : -1;

    const target = Math.max(0, base + dir * maxOffset);

    this.playGrain(dir, target, grainSec, fadeSec);

    i++;
    if (i >= bursts) {
      if (this.scratchTimer !== null) {
        window.clearInterval(this.scratchTimer);
        this.scratchTimer = null;
      }
      // 마지막에 원래 위치로 복귀
      this.seek(base);
      if (wasPlaying) this.play();
    }
  }, jumpMs);
}

private playGrain(dir: 1 | -1, posSec: number, grainSec: number, fadeSec: number): void {
  if (!this.buffer || !this.reverseBuffer) return;

  const now = this.ctx.currentTime;

  const src = this.ctx.createBufferSource();
  const g = this.ctx.createGain();

  // ✅ dir=+1: 원본 / dir=-1: reverseBuffer 사용
  if (dir === 1) {
    src.buffer = this.buffer;
    src.playbackRate.value = 1.0;

    const offset = Math.max(0, Math.min(this.buffer.duration - grainSec, posSec));
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1, now + fadeSec);
    g.gain.linearRampToValueAtTime(0, now + grainSec);

    src.connect(g);
    g.connect(this.scratchGain);
    src.start(now, offset, grainSec);
  } else {
    src.buffer = this.reverseBuffer;
    src.playbackRate.value = 1.0;

    // reverseBuffer에서는 시간축이 뒤집혀 있으므로 offset 변환 필요
    const revOffset = Math.max(
      0,
      Math.min(this.reverseBuffer.duration - grainSec, this.buffer.duration - posSec - grainSec)
    );

    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1, now + fadeSec);
    g.gain.linearRampToValueAtTime(0, now + grainSec);

    src.connect(g);
    g.connect(this.scratchGain);
    src.start(now, revOffset, grainSec);
  }
}
}