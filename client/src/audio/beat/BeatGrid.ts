import type { BeatGrid as BeatGridType } from "./type";

export function createBeatGrid(bpm: number, anchorSec: number): BeatGridType {
  const beatIntervalSec = 60 / bpm;

  const getNearestBeatSec = (t: number): number => {
    if (beatIntervalSec <= 0) return t;
    const k = Math.round((t - anchorSec) / beatIntervalSec);
    return anchorSec + k * beatIntervalSec;
  };

  const getNextBeatSec = (t: number): number => {
    const k = Math.floor((t - anchorSec) / beatIntervalSec) + 1;
    return anchorSec + k * beatIntervalSec;
  };

  return { bpm, anchorSec, beatIntervalSec, getNearestBeatSec, getNextBeatSec };
}