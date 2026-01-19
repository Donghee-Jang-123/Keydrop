import type { BeatAnalysis } from "./type";
import { estimateBpmFromPeaks } from "./BpmEstimator";

export class BeatAnalyzer {
  /**
   * 아주 단순한 방식:
   * - mono downmix
   * - envelope(절대값) + 다운샘플
   * - local peak 검출
   * - peak 간격 분포로 BPM 추정
   */
  public analyze(buffer: AudioBuffer): BeatAnalysis {
    const sampleRate = buffer.sampleRate;

    // 1) mono downmix
    const mono = this.toMono(buffer);

    // 2) envelope 만들고 다운샘플(계산량 줄이기)
    const hop = Math.max(1, Math.floor(sampleRate / 200)); // 200Hz envelope
    const env: number[] = [];
    for (let i = 0; i < mono.length; i += hop) {
      let sum = 0;
      const end = Math.min(mono.length, i + hop);
      for (let j = i; j < end; j++) sum += Math.abs(mono[j]);
      env.push(sum / (end - i));
    }

    // 3) 간단한 smoothing(이동평균)
    const smooth = movingAverage(env, 5);

    // 4) peak 검출
    const peaksIdx = findLocalPeaks(smooth, {
      minDistance: 6,         // envelope index 기준 (대충 30ms)
      thresholdPercentile: 0.85,
    });

    const peaksSec = peaksIdx.map((k) => (k * hop) / sampleRate);

    // 5) BPM 추정
    const { bpm, confidence } = estimateBpmFromPeaks(peaksSec);

    // anchor: 임시로 첫 피크(후에 downbeat 추정으로 개선)
    const anchorSec = peaksSec[0] ?? 0;

    return { bpm, confidence, peaksSec, anchorSec };
  }

  private toMono(buffer: AudioBuffer): Float32Array {
    const ch = buffer.numberOfChannels;
    const len = buffer.length;
    if (ch === 1) return buffer.getChannelData(0).slice(0);

    const out = new Float32Array(len);
    for (let c = 0; c < ch; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < len; i++) out[i] += data[i] / ch;
    }
    return out;
  }
}

function movingAverage(x: number[], win: number): number[] {
  const w = Math.max(1, win | 0);
  const out = new Array<number>(x.length);
  let acc = 0;
  for (let i = 0; i < x.length; i++) {
    acc += x[i];
    if (i >= w) acc -= x[i - w];
    out[i] = acc / Math.min(w, i + 1);
  }
  return out;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

function findLocalPeaks(
  x: number[],
  opts: { minDistance: number; thresholdPercentile: number }
): number[] {
  const { minDistance, thresholdPercentile } = opts;
  if (x.length < 3) return [];

  const copy = [...x].sort((a, b) => a - b);
  const thr = percentile(copy, thresholdPercentile);

  const peaks: number[] = [];
  let last = -Infinity;

  for (let i = 1; i < x.length - 1; i++) {
    if (x[i] < thr) continue;
    if (x[i] > x[i - 1] && x[i] >= x[i + 1]) {
      if (i - last >= minDistance) {
        peaks.push(i);
        last = i;
      }
    }
  }
  return peaks;
}