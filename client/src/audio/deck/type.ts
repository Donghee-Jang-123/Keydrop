export type DeckId = 1 | 2;

export type CueIndex = 1 | 2;

export type DeckEQ = {
  bassGainDb: number;
  midGainDb: number;
};

export type DeckFilter = {
  value01: number;
};

export type DeckState = {
  isPlaying: boolean;
  durationSec: number;
  positionSec: number;
  playbackRate: number;
  cues: Record<number, number | undefined>;
};