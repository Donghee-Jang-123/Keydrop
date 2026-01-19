import { create } from 'zustand';

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
  isplay: boolean;
  fx: FxType | null;
}

interface DJState {
  deck1: DeckState;
  deck2: DeckState;
  crossFader: number;
  bpm: number;
  fxTargetDeck: 1 | 2; // NUMPAD FX가 적용될 덱
  
  actions: {
    // 통합 업데이트 함수
    updateValue: (target: ControlTarget, delta: number, deckIdx?: 1 | 2) => void;
    setPlayState: (deckIdx: 1 | 2, state: boolean) => void;
    toggleFxTargetDeck: () => void;
    setFx: (fx: FxType | null, deckIdx?: 1 | 2) => void;
  };
}

export const useDJStore = create<DJState>((set) => ({
  // 초기 상태 설정
  deck1: { mid: 0.5, bass: 0.5, filter: 0.5, fader: 1.0, isplay: false, fx: null },
  deck2: { mid: 0.5, bass: 0.5, filter: 0.5, fader: 1.0, isplay: false, fx: null },
  crossFader: 0.0, // -1.0(왼쪽) ~ 1.0(오른쪽)
  bpm: 120.0,
  fxTargetDeck: 1,

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

    setPlayState: (deckIdx, isplay) =>
      set((state) => ({
        [deckIdx === 1 ? 'deck1' : 'deck2']: {
          ...state[deckIdx === 1 ? 'deck1' : 'deck2'],
          isplay,
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
  },
}));

export const useDJActions = () => useDJStore((state) => state.actions);