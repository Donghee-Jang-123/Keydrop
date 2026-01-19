import { create } from 'zustand';
import type { Music } from '../types/music';

// 1. 제어 대상 타입 정의
export type ControlTarget = 'mid' | 'bass' | 'filter' | 'fader' | 'crossFader' | 'bpm';
export type FxType = 'CRUSH' | 'FLANGER' | 'SLICER' | 'KICK';

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

// 2. 데크별 상세 상태 구조
interface DeckState {
  mid: number;
  bass: number;
  filter: number;
  fader: number;
  isPlaying: boolean;
  fx: FxType | null;
  trackTitle: string;
  artist?: string;
  trackBpm?: number;
  durationSec?: number;
  positionSec?: number;
  waveformPeaks?: Float32Array | null;
}

interface DJState {
  deck1: DeckState;
  deck2: DeckState;
  crossFader: number;
  bpm: number;
  fxTargetDeck: 1 | 2; // NUMPAD FX가 적용될 덱
  filePickerDeck: 1 | 2 | null; // 로컬 파일 선택창을 열 덱(요청 상태)
  
  pendingDbLoad: {
    deckIdx: 1 | 2;
    track: Music;
    nonce: number;
  } | null;

  libraryTracks: Music[];
  librarySelectedIndex: number;
  // 키보드로 "조작 중"인 컨트롤 표시용 (ex: deck1:mid, deck2:fader, cross)
  activeControls: Record<string, boolean>;

  actions: {
    // 통합 업데이트 함수
    updateValue: (target: ControlTarget, delta: number, deckIdx?: 1 | 2) => void;
    setPlayState: (deckIdx: 1 | 2, state: boolean) => void;
    toggleFxTargetDeck: () => void;
    setFx: (fx: FxType | null, deckIdx?: 1 | 2) => void;
    requestLoadMusicFromDb: (deckIdx: 1 | 2, track: Music) => void;
    clearDbLoadRequest: () => void;
    setDeckMetaFromDb: (deckIdx: 1 | 2, meta: { title: string; artist: string; bpm: number; durationSec: number }) => void;
    requestLocalFile: (deckIdx: 1 | 2) => void;
    clearLocalFileRequest: () => void;
    setTrackTitle: (deckIdx: 1 | 2, title: string) => void;
    setLibraryTracks: (tracks: Music[]) => void;
    selectNextTrack: () => void;
    requestLoadSelectedToDeck: (deckIdx: 1 | 2) => void;
    setWaveform: (deckIdx: 1 | 2, peaks: Float32Array) => void;
    setControlActive: (id: string, active: boolean) => void;
    setPositionSec: (deckIdx: 1 | 2, positionSec: number) => void;
    setDurationSec: (deckIdx: 1 | 2, durationSec: number) => void;
  };
}

export const useDJStore = create<DJState>((set) => ({
  // 초기 상태 설정
  deck1: { 
    mid: 0.5, bass: 0.5, filter: 0.5, fader: 1.0, isPlaying: false, fx: null, 
    trackTitle: '', artist: '', trackBpm: 0, durationSec: 0, positionSec: 0, waveformPeaks: null,
  },
  deck2: { 
    mid: 0.5, bass: 0.5, filter: 0.5, fader: 1.0, isPlaying: false, fx: null, 
    trackTitle: '', artist: '', trackBpm: 0, durationSec: 0, positionSec: 0, waveformPeaks: null,
  },
  crossFader: 0.0, // -1.0(왼쪽) ~ 1.0(오른쪽)
  bpm: 120.0,
  fxTargetDeck: 1,
  filePickerDeck: null,
  libraryTracks: [],
  librarySelectedIndex: 0,

  pendingDbLoad: null,
  activeControls: {},
  
  actions: {
    updateValue: (target, delta, deckIdx) =>
      set((state) => {
        // A. 글로벌 파라미터 처리 (BPM, CrossFader)
        if (target === 'bpm') {
          return { bpm: clamp(state.bpm + delta, 60, 200) };
        }
        if (target === 'crossFader') {
          return { crossFader: clamp(state.crossFader + delta, -1, 1) };
        }

        // B. Deck별 파라미터 처리 (Mid, Bass, Filter, Fader)
        if (deckIdx) {
          const deckKey = deckIdx === 1 ? 'deck1' : 'deck2';
          const newValue = clamp(state[deckKey][target as keyof DeckState] as number + delta, 0, 1);
          
          return {
            [deckKey]: { //Computed Property Name
              ...state[deckKey], //전개연산자
              [target]: newValue, //특정 파라미터 업데이트
            },
          };
        }

        return state;
      }),

    setPlayState: (deckIdx, isPlaying) =>
      set((state) => ({
        [deckIdx === 1 ? 'deck1' : 'deck2']: {
          ...state[deckIdx === 1 ? 'deck1' : 'deck2'],
          isPlaying,
        },
      })),

    toggleFxTargetDeck: () =>
      set((state) => ({
        fxTargetDeck: state.fxTargetDeck === 1 ? 2 : 1,
      })),

    setFx: (fx, deckIdx) =>
      set((state) => {
        const targetDeck = deckIdx ?? state.fxTargetDeck;
        const deckKey = targetDeck === 1 ? 'deck1' : 'deck2';
        return {
          [deckKey]: {
            ...state[deckKey],
            fx,
          },
        };
      }),

    requestLocalFile: (deckIdx) =>
      set(() => ({
        filePickerDeck: deckIdx,
      })),

    clearLocalFileRequest: () =>
      set(() => ({
        filePickerDeck: null,
      })),

    setTrackTitle: (deckIdx, title) =>
      set((state) => {
        const deckKey = deckIdx === 1 ? 'deck1' : 'deck2';
        return {
          [deckKey]: {
            ...state[deckKey],
            trackTitle: title,
          },
        };
      }),

    requestLoadMusicFromDb: (deckIdx, track) =>
      set(() => ({
        pendingDbLoad: {
          deckIdx,
          track,
          nonce: Date.now(),
        },
      })),

    clearDbLoadRequest: () =>
      set(() => ({
        pendingDbLoad: null,
      })),

    setDeckMetaFromDb: (deckIdx, meta) =>
      set((state) => {
        const deckKey = deckIdx === 1 ? 'deck1' : 'deck2';
        return {
          [deckKey]: {
            ...state[deckKey],
            trackTitle: meta.title,
            artist: meta.artist,
            trackBpm: meta.bpm,
            durationSec: meta.durationSec,
            positionSec: 0,
          },
        } as any;
      }),
    setLibraryTracks: (tracks) =>
      set(() => ({
        libraryTracks: tracks,
        librarySelectedIndex: tracks.length ? 0 : 0,
      })),

    selectNextTrack: () =>
      set((state) => {
        const n = state.libraryTracks.length;
        if (!n) return state;
        const next = (state.librarySelectedIndex + 1) % n;
        return { librarySelectedIndex: next };
      }),

    requestLoadSelectedToDeck: (deckIdx) =>
      set((state) => {
        const t = state.libraryTracks[state.librarySelectedIndex];
        if (!t) return state;
        return {
          pendingDbLoad: { deckIdx, track: t, nonce: Date.now() }, };
      }),  
    setWaveform: (deckIdx, peaks) =>
      set((state) => {
        const deckKey = deckIdx === 1 ? 'deck1' : 'deck2';
        return {
          [deckKey]: {
            ...state[deckKey],
            waveformPeaks: peaks,
          },
        } as any;
      }),

    setControlActive: (id, active) =>
      set((state) => ({
        activeControls: {
          ...state.activeControls,
          [id]: active,
        },
      })),

    setPositionSec: (deckIdx, positionSec) =>
      set((state) => {
        const deckKey = deckIdx === 1 ? 'deck1' : 'deck2';
        return {
          [deckKey]: {
            ...state[deckKey],
            positionSec,
          },
        } as any;
      }),

    setDurationSec: (deckIdx, durationSec) =>
      set((state) => {
        const deckKey = deckIdx === 1 ? 'deck1' : 'deck2';
        return {
          [deckKey]: {
            ...state[deckKey],
            durationSec,
          },
        } as any;
      }),
  },
}));

export const useDJActions = () => useDJStore((state) => state.actions);