export type BeatAnalysis = {
  bpm: number;                // 추정 BPM
  confidence: number;         // 0..1 대충 신뢰도
  peaksSec: number[];         // 검출된 타격(피크) 시간들
  anchorSec: number;          // 비트 그리드 기준점(임시: 첫 피크)
};

export type BeatGrid = {
  bpm: number;
  anchorSec: number;
  beatIntervalSec: number;
  getNearestBeatSec(t: number): number;
  getNextBeatSec(t: number): number;
};