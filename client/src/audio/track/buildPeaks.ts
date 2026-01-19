export function buildPeaks(buffer: AudioBuffer, bars: number): Float32Array {
  const ch0 = buffer.getChannelData(0);
  const out = new Float32Array(bars);

  const step = ch0.length / bars; // float

  let globalMax = 0;

  for (let i = 0; i < bars; i++) {
    const start = Math.floor(i * step);
    const end = Math.max(start + 1, Math.floor((i + 1) * step));

    let max = 0;
    for (let j = start; j < end && j < ch0.length; j++) {
      const v = Math.abs(ch0[j]);
      if (v > max) max = v;
    }

    out[i] = max;
    if (max > globalMax) globalMax = max;
  }

  // 정규화(트랙마다 높이 비슷하게)
  if (globalMax > 0) {
    for (let i = 0; i < out.length; i++) out[i] = out[i] / globalMax;
  }

  return out;
}