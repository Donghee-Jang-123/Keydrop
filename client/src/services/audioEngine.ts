import { AudioEngine as CoreEngine } from '../audio/core/AudioEngine';
import { AudioBus } from '../audio/core/AudioBus';
import { Deck } from '../audio/deck/Deck';
import { Mixer } from '../audio/mixer/Mixer';
import { FXRack, type FXType as FXTypeLower } from '../audio/fx/FXRack';
import { useDJStore } from '../store/useDJStore';

export type ControlTarget = 'mid' | 'bass' | 'filter' | 'fader' | 'crossFader' | 'bpm';
export type FxType = 'CRUSH' | 'FLANGER' | 'SLICER' | 'KICK';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clamp11 = (v: number) => Math.max(-1, Math.min(1, v));

const fxToLower = (fx: FxType): FXTypeLower => {
  if (fx === 'CRUSH') return 'crush';
  if (fx === 'FLANGER') return 'flanger';
  if (fx === 'SLICER') return 'slicer';
  return 'kick';
};

function buildPeaks(buffer: AudioBuffer, bars = 1200): Float32Array {
  // bars: 화면 가로폭과 비슷한 “막대 개수”
  // top-wave는 1200~2000 추천, deck-wave는 600~1200 추천
  const ch0 = buffer.getChannelData(0);
  const len = ch0.length;

  const peaks = new Float32Array(bars);
  const step = Math.max(1, Math.floor(len / bars));

  for (let i = 0; i < bars; i++) {
    const start = i * step;
    const end = Math.min(len, start + step);

    let max = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(ch0[j]);
      if (v > max) max = v;
    }
    peaks[i] = max; // 0..1 근처
  }

  // 살짝 정규화(너무 작은 곡이 안 보이는 것 방지)
  let globalMax = 0;
  for (let i = 0; i < peaks.length; i++) globalMax = Math.max(globalMax, peaks[i]);
  if (globalMax > 0) {
    for (let i = 0; i < peaks.length; i++) peaks[i] = peaks[i] / globalMax;
  }

  return peaks;
}

type DeckParams = { mid01: number; bass01: number; filter01: number; fader01: number };

class KeydropAudioEngineAdapter {
  private readonly engine = CoreEngine.instance;
  private bus: AudioBus | null = null;
  private mixer: Mixer | null = null;
  private deck1: Deck | null = null;
  private deck2: Deck | null = null;
  private fx1: FXRack | null = null;
  private fx2: FXRack | null = null;

  private initPromise: Promise<void> | null = null;

  private params: Record<1 | 2, DeckParams> = {
    1: { mid01: 0.5, bass01: 0.5, filter01: 0.5, fader01: 1.0 },
    2: { mid01: 0.5, bass01: 0.5, filter01: 0.5, fader01: 1.0 },
  };
  private cross = 0;
  private activeFx: Record<1 | 2, FxType | null> = { 1: null, 2: null };

  private async ensureGraph(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      await this.engine.resume();

      if (!this.bus) this.bus = new AudioBus(this.engine.ctx);
      if (!this.deck1) this.deck1 = new Deck(this.engine.ctx, 1);
      if (!this.deck2) this.deck2 = new Deck(this.engine.ctx, 2);

      if (!this.fx1) this.fx1 = new FXRack(this.engine.ctx);
      if (!this.fx2) this.fx2 = new FXRack(this.engine.ctx);

      if (!this.mixer) {
        const mixer = new Mixer(this.engine.ctx);

        this.deck1.output.connect(this.fx1.input);
        this.deck2.output.connect(this.fx2.input);

        mixer.connectDeck1(this.fx1.output);
        mixer.connectDeck2(this.fx2.output);

        mixer.connectTo(this.bus.masterGain);
        this.mixer = mixer;
      }

      // Zustand 초기값으로 파라미터 싱크
      const s = useDJStore.getState();
      this.params[1] = { mid01: s.deck1.mid, bass01: s.deck1.bass, filter01: s.deck1.filter, fader01: s.deck1.fader };
      this.params[2] = { mid01: s.deck2.mid, bass01: s.deck2.bass, filter01: s.deck2.filter, fader01: s.deck2.fader };
      this.cross = s.crossFader;

      this.applyDeckParams(1);
      this.applyDeckParams(2);
      this.mixer.setCrossfader(this.cross);
    })();

    return this.initPromise;
  }

  private getDeck(deck: 1 | 2): Deck {
    const d = deck === 1 ? this.deck1 : this.deck2;
    if (!d) throw new Error('Audio graph not ready');
    return d;
  }

  // UI 폴링용: 그래프가 준비되어 있고 버퍼가 로드된 경우에만 상태를 반환
  public peekDeckState(deck: 1 | 2): { isPlaying: boolean; durationSec: number; positionSec: number } | null {
    const d = deck === 1 ? this.deck1 : this.deck2;
    if (!d) return null;
    if (!d.getBuffer()) return null;
    const s = d.getState();
    return { isPlaying: s.isPlaying, durationSec: s.durationSec, positionSec: s.positionSec };
  }

  private async decodeFile(file: File): Promise<AudioBuffer> {
    const ab = await file.arrayBuffer();
    const buf = await this.engine.ctx.decodeAudioData(ab.slice(0));
    return buf;
  }

  private getFx(deck: 1 | 2): FXRack {
    const fx = deck === 1 ? this.fx1 : this.fx2;
    if (!fx) throw new Error('Audio graph not ready');
    return fx;
  }

  private applyDeckParams(deck: 1 | 2) {
    const d = this.getDeck(deck);
    const p = this.params[deck];

    // mid/bass: 0..1 -> -12..+12 dB (0.5가 0dB)
    const midDb = (p.mid01 - 0.5) * 24;
    const bassDb = (p.bass01 - 0.5) * 24;

    d.setMidGainDb(midDb);
    d.setBassGainDb(bassDb);
    d.setFilterValue(p.filter01);
    d.setFader(p.fader01);
  }

  public readonly decks = {
    1: {
      adjustParam: (target: ControlTarget, delta: number) => {
        void this.ensureGraph().then(() => {
          const p = this.params[1];
          if (target === 'mid') p.mid01 = clamp01(p.mid01 + delta);
          if (target === 'bass') p.bass01 = clamp01(p.bass01 + delta);
          if (target === 'filter') p.filter01 = clamp01(p.filter01 + delta);
          if (target === 'fader') p.fader01 = clamp01(p.fader01 + delta);
          this.applyDeckParams(1);
        });
      },
      jumpToCue: (index: number) => {
        void this.ensureGraph().then(() => this.getDeck(1).jumpCue(index as 1 | 2));
      },
      togglePlay: () => {
        void this.ensureGraph().then(() => {
          const d = this.getDeck(1);

          if (!d.getBuffer()) return;

          d.toggle();

          const isPlaying = d.getState().isPlaying;
          useDJStore.getState().actions.setPlayState(1, isPlaying);
        });
      },
      loadFile: (file: File) => {
        void this.ensureGraph().then(async () => {
          const buf = await this.decodeFile(file);
          this.getDeck(1).load(buf);

          const peaks = buildPeaks(buf, 1400);
          useDJStore.getState().actions.setWaveform(1, peaks);
        });
      },
      applyFx: (fx: FxType | null) => {
        void this.ensureGraph().then(() => {
          const rack = this.getFx(1);
          // OFF면 전부 끄기
          if (!fx) {
            (['crush', 'flanger', 'slicer', 'kick'] as FXTypeLower[]).forEach((t) => rack.setEnabled(t, false));
            this.activeFx[1] = null;
            return;
          }
          const next = fxToLower(fx);
          // 이전 FX는 끄고, 새 FX만 켜기
          (['crush', 'flanger', 'slicer', 'kick'] as FXTypeLower[]).forEach((t) => rack.setEnabled(t, t === next));
          this.activeFx[1] = fx;
        });
      },
        startScratchHold: (opts?: { grainMs?: number; jumpMs?: number; intensity?: number }) => {
          void this.ensureGraph().then(() => {
            const d = this.getDeck(1);

            console.log('[SCRATCH] start requested (deck1)', {
              hasBuffer: !!d.getBuffer(),
              isPlaying: d.getState().isPlaying,
            });

            d.startScratchHold(opts);
          });
        },
        stopScratchHold: () => {
          void this.ensureGraph().then(() => this.getDeck(1).stopScratchHold());
        },
    },
    2: {
      adjustParam: (target: ControlTarget, delta: number) => {
        void this.ensureGraph().then(() => {
          const p = this.params[2];
          if (target === 'mid') p.mid01 = clamp01(p.mid01 + delta);
          if (target === 'bass') p.bass01 = clamp01(p.bass01 + delta);
          if (target === 'filter') p.filter01 = clamp01(p.filter01 + delta);
          if (target === 'fader') p.fader01 = clamp01(p.fader01 + delta);
          this.applyDeckParams(2);
        });
      },
      jumpToCue: (index: number) => {
        void this.ensureGraph().then(() => this.getDeck(2).jumpCue(index as 1 | 2));
      },
      togglePlay: () => {
        void this.ensureGraph().then(() => {
          const d = this.getDeck(2);

          if (!d.getBuffer()) return;

          d.toggle();

          const isPlaying = d.getState().isPlaying;
          useDJStore.getState().actions.setPlayState(2, isPlaying);
        });
      },
      loadFile: (file: File) => {
        void this.ensureGraph().then(async () => {
          const buf = await this.decodeFile(file);
          this.getDeck(2).load(buf);

          const peaks = buildPeaks(buf, 1400);
          useDJStore.getState().actions.setWaveform(2, peaks);
        });
      },
      applyFx: (fx: FxType | null) => {
        void this.ensureGraph().then(() => {
          const rack = this.getFx(2);
          if (!fx) {
            (['crush', 'flanger', 'slicer', 'kick'] as FXTypeLower[]).forEach((t) => rack.setEnabled(t, false));
            this.activeFx[2] = null;
            return;
          }
          const next = fxToLower(fx);
          (['crush', 'flanger', 'slicer', 'kick'] as FXTypeLower[]).forEach((t) => rack.setEnabled(t, t === next));
          this.activeFx[2] = fx;
        });
      },
        startScratchHold: (opts?: { grainMs?: number; jumpMs?: number; intensity?: number }) => {
          void this.ensureGraph().then(() => {
            const d = this.getDeck(2);

            console.log('[SCRATCH] start requested (deck1)', {
              hasBuffer: !!d.getBuffer(),
              isPlaying: d.getState().isPlaying,
            });

            d.startScratchHold(opts);
          });
        },
        stopScratchHold: () => {
          void this.ensureGraph().then(() => this.getDeck(2).stopScratchHold());
        },
    },
  } as const;

  public readonly mixerApi = {
    adjustCrossFader: (delta: number) => {
      void this.ensureGraph().then(() => {
        this.cross = clamp11(this.cross + delta);
        this.mixer?.setCrossfader(this.cross);
      });
    },
    sync: () => {
      // Beat 분석/SyncService는 아직 UI에서 연결하지 않아서 일단 no-op.
      // 필요하면 master/slave 선택 + BeatAnalysis 연결해서 SyncService로 교체 가능.
      void this.ensureGraph();
      console.log('[Mixer] sync requested (not wired yet)');
    },
  } as const;
}

const adapter = new KeydropAudioEngineAdapter();

// useInputmanager가 기대하는 shape
export const audioEngine = {
  decks: adapter.decks,
  mixer: adapter.mixerApi,
  peekDeckState: (deckIdx: 1 | 2) => adapter.peekDeckState(deckIdx),
};
