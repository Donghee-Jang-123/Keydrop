import React, { useEffect, useMemo, useRef } from 'react';
import { useDJStore } from '../store/useDJStore';

interface WaveformBarProps {
  deckIdx: 1 | 2;
  variant?: 'top' | 'deck';
}

const DPR = () => Math.max(1, Math.floor(window.devicePixelRatio || 1));

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  peaks: Float32Array,
  w: number,
  h: number,
  playhead01: number,
  variant: 'top' | 'deck'
) {
  // 중앙선 기준 상/하 대칭 웨이브
  const midY = Math.floor(h / 2);

  // 배경 그리드(원하면 삭제 가능)
  ctx.globalAlpha = 0.12;
  for (let x = 0; x < w; x += variant === 'top' ? 40 : 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 웨이브
  const n = peaks.length;
  if (!n) return;

  // peaks가 "bar 개수"만큼 이미 만들어진 걸 전제 (width에 맞춰서)
  // (만약 peaks 길이가 width와 다르면 자동으로 리샘플)
  const sampleAt = (x: number) => {
    const t = x / Math.max(1, w - 1);
    const idx = Math.floor(t * (n - 1));
    return peaks[idx] ?? 0;
  };

  ctx.lineWidth = 1;

  for (let x = 0; x < w; x++) {
    const a = Math.max(0, Math.min(1, sampleAt(x)));
    const amp = Math.floor(a * (h * 0.48));

    // (색 지정 안 좋아하면 CSS 변수로 바꿔도 됨)
    // 기본: 상단은 초록/파랑 느낌, 덱은 살짝 더 진하게
    // 여기선 "색 지정"이지만 최소한으로만 해둠
    ctx.strokeStyle = variant === 'top' ? 'rgba(160, 255, 190, 0.8)' : 'rgba(160, 255, 190, 0.9)';

    ctx.beginPath();
    ctx.moveTo(x + 0.5, midY - amp);
    ctx.lineTo(x + 0.5, midY + amp);
    ctx.stroke();
  }

  // 플레이헤드
  const px = Math.floor(clamp01(playhead01) * (w - 1));
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px + 0.5, 0);
  ctx.lineTo(px + 0.5, h);
  ctx.stroke();
}

const WaveformBar: React.FC<WaveformBarProps> = ({ variant = 'top', deckIdx }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // peaks: top이면 "믹스 웨이브"를 따로 만들거나, 일단 deck1로 테스트해도 됨
  // 여기서는 top일 때 deck1 peaks를 임시로 보여주게 해둠(원하면 later에 믹스용으로 확장)
  const topPeak = useDJStore((s) => s.deck1.waveformPeaks ?? null);
  const bottomPeak = useDJStore((s) => s.deck2.waveformPeaks ?? null);
  const deckPeaks = useDJStore((s) =>
    (deckIdx === 1 ? s.deck1.waveformPeaks : s.deck2.waveformPeaks) ?? null
  );

  const deckState = useDJStore((s) => {
    if (variant !== 'deck') return null;
    if (!deckIdx) return null;
    return deckIdx === 1 ? s.deck1 : s.deck2;
  });

  // 플레이헤드 위치(0..1)
  // 지금 store에 positionSec이 없으니: 우선 isplay일 때 그냥 0으로 두고,
  // 나중에 Deck.getState().positionSec를 store로 흘려주면 여기서 반영하면 됨.
  const playhead01 = useMemo(() => {
    if (!deckState?.durationSec || deckState.durationSec <= 0) return 0;
    // TODO: positionSec store에 넣으면 여기에서 계산
    return 0;
  }, [deckState?.durationSec]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const dpr = DPR();
    const rect = c.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    c.width = w * dpr;
    c.height = h * dpr;

    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';

    // 기본 stroke 색(그리드용)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';

    if (variant === 'top') {
      if (!topPeak && !bottomPeak) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
    } else {
      if (!deckPeaks || deckPeaks.length === 0) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
    }

    if (variant === 'top') {
      ctx.clearRect(0, 0, w, h);

      const halfH = Math.floor(h / 2);

      if (topPeak) {
        ctx.save();
        ctx.translate(0, 0);
        drawWaveform(ctx, topPeak, w, halfH, 0, 'top');
        ctx.restore();
      }

      if (bottomPeak) {
        ctx.save();
        ctx.translate(0, halfH);
        drawWaveform(ctx, bottomPeak, w, halfH, 0, 'top');
        ctx.restore();
      }
      return;
    }

    if (!deckPeaks || deckPeaks.length === 0) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    drawWaveform(ctx, deckPeaks, w, h, playhead01, 'deck');
  }, [variant, topPeak, bottomPeak, deckPeaks, playhead01]);

  return (
    <div className={`wave wave--${variant}`} aria-hidden="true">
      <canvas ref={canvasRef} className="wave__canvas" />
    </div>
  );
};

export default WaveformBar;