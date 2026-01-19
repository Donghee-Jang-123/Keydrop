export function estimateBpmFromPeaks(peaksSec: number[]): { bpm: number; confidence: number } {
  if (peaksSec.length < 6) return { bpm: 120, confidence: 0 };

  const diffs: number[] = [];
  for (let i = 1; i < peaksSec.length; i++) {
    const d = peaksSec[i] - peaksSec[i - 1];
    if (d > 0.08 && d < 1.2) diffs.push(d);
  }
  if (diffs.length < 4) return { bpm: 120, confidence: 0 };

  const candidates = diffs
    .map((d) => 60 / d)
    .map((b) => foldToRange(b, 80, 180));

  const bins = new Map<number, number>();
  for (const b of candidates) {
    const key = Math.round(b);
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }

  let bestBpm = 120;
  let bestCount = 0;
  for (const [k, c] of bins.entries()) {
    if (c > bestCount) {
      bestCount = c;
      bestBpm = k;
    }
  }

  const confidence = Math.max(0, Math.min(1, bestCount / candidates.length));
  return { bpm: bestBpm, confidence };
}

function foldToRange(bpm: number, min: number, max: number): number {
  let b = bpm;
  while (b < min) b *= 2;
  while (b > max) b /= 2;
  return b;
}