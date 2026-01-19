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
  variant: 'top' | 'deck',
  deckIdx?: 1 | 2
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

    if (amp === 0) continue; // 진폭이 없으면 스킵

    // deckIdx에 따라 기본 색상 설정: deck1은 초록색, deck2는 파란색
    let baseColor: [number, number, number] = [100, 255, 100]; // 기본 초록색
    if (deckIdx === 1) {
      baseColor = [100, 255, 100]; // 초록색
    } else if (deckIdx === 2) {
      baseColor = [71, 212, 255]; // 파란색
    }

    // 수직 그라데이션 생성 (안쪽에서 바깥쪽으로 어두워짐)
    const gradient = ctx.createLinearGradient(0, midY - amp, 0, midY + amp);
    const [r, g, b] = baseColor;

    // 중앙(안쪽)은 밝게, 끝(바깥쪽)은 어둡게
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);     // 위쪽 끝 (어둠)
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 1.0)`);   // 중앙 (밝음)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.4)`);     // 아래쪽 끝 (어둠)

    ctx.strokeStyle = gradient;

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

  // playhead 용 position/duration
  const deck1Pos = useDJStore((s) => s.deck1.positionSec ?? 0);
  const deck1Dur = useDJStore((s) => s.deck1.durationSec ?? 0);
  const deck2Pos = useDJStore((s) => s.deck2.positionSec ?? 0);
  const deck2Dur = useDJStore((s) => s.deck2.durationSec ?? 0);

  const deckState = useDJStore((s) => {
    if (variant !== 'deck') return null;
    if (!deckIdx) return null;
    return deckIdx === 1 ? s.deck1 : s.deck2;
  });

  // 플레이헤드 위치(0..1)
  const playhead01 = useMemo(() => {
    const dur = deckState?.durationSec ?? 0;
    const pos = deckState?.positionSec ?? 0;
    if (!dur || dur <= 0) return 0;
    return clamp01(pos / dur);
  }, [deckState?.durationSec, deckState?.positionSec]);

  const topPlayhead01 = useMemo(() => {
    if (!deck1Dur || deck1Dur <= 0) return 0;
    return clamp01(deck1Pos / deck1Dur);
  }, [deck1Pos, deck1Dur]);

  const bottomPlayhead01 = useMemo(() => {
    if (!deck2Dur || deck2Dur <= 0) return 0;
    return clamp01(deck2Pos / deck2Dur);
  }, [deck2Pos, deck2Dur]);

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
        drawWaveform(ctx, topPeak, w, halfH, topPlayhead01, 'top', 1);
        ctx.restore();
      }

      if (bottomPeak) {
        ctx.save();
        ctx.translate(0, halfH);
        drawWaveform(ctx, bottomPeak, w, halfH, bottomPlayhead01, 'top', 2);
        ctx.restore();
      }
      return;
    }

    if (!deckPeaks || deckPeaks.length === 0) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    ctx.clearRect(0, 0, w, h);
    drawWaveform(ctx, deckPeaks, w, h, playhead01, 'deck', deckIdx);
  }, [variant, topPeak, bottomPeak, deckPeaks, playhead01, topPlayhead01, bottomPlayhead01]);

  return (
    <div className={`wave wave--${variant}`} aria-hidden="true">
      <canvas ref={canvasRef} className="wave__canvas" />
    </div>
  );
};

export default WaveformBar;