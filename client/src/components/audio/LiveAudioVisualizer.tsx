import { useEffect, useMemo, useRef } from "react";

type Props = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  height?: number;
  barCount?: number;
  /**
   * joined 전에도 화면이 덜 비어 보이도록 idle 애니메이션을 돌립니다.
   * 실제 오디오 분석이 가능해지면 자동으로 주파수 기반으로 전환됩니다.
   */
  idle?: boolean;
};

export default function LiveAudioVisualizer({
  audioRef,
  height = 150,
  barCount = 44,
  idle = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);

  // idle 애니메이션을 더 “오디오 비주얼라이저”처럼 보이게 하는 고정 위상/속도 배열
  const phases = useMemo(
    () =>
      Array.from({ length: barCount }).map(() => ({
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2,
        bias: 0.15 + Math.random() * 0.2,
      })),
    [barCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getAudioCtx = () => {
      const W = window as any;
      const Ctx = (W.AudioContext || W.webkitAudioContext) as typeof AudioContext | undefined;
      if (!Ctx) return null;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      return audioCtxRef.current;
    };

    const ensureGraph = () => {
      const el = audioRef.current;
      if (!el) return;

      const ctx = getAudioCtx();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        // 사용자 제스처 이후(Enter 버튼 클릭)엔 보통 resume이 성공함
        ctx.resume().catch(() => { });
      }

      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;
        analyserRef.current = analyser;
      }

      // MediaElementSource는 element 당 한 번만 만들 수 있으니 ref로 재사용
      if (!srcRef.current) {
        try {
          srcRef.current = ctx.createMediaElementSource(el);
        } catch {
          // 이미 다른 곳에서 연결했거나, 브라우저 제한일 수 있음
          srcRef.current = null;
        }
      }

      if (srcRef.current && analyserRef.current) {
        // 연결이 중복되어도 큰 문제는 없지만, 가능한 한 idempotent하게 유지
        try {
          srcRef.current.disconnect();
        } catch { }
        try {
          analyserRef.current.disconnect();
        } catch { }

        srcRef.current.connect(analyserRef.current);
        // 오디오는 계속 들려야 하므로 destination으로도 연결
        analyserRef.current.connect(ctx.destination);
      }
    };

    const draw = () => {
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(height));

      // 캔버스 실제 해상도 설정 (선명도)
      const targetW = Math.floor(w * dpr);
      const targetH = Math.floor(h * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      ensureGraph();

      // 배경 (유리 느낌)
      ctx2d.clearRect(0, 0, w, h);
      const bg = ctx2d.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "rgba(255,255,255,0.06)");
      bg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx2d.fillStyle = bg;
      ctx2d.fillRect(0, 0, w, h);

      const analyser = analyserRef.current;
      const haveAnalyser = !!(analyser && srcRef.current);

      let values: number[] | null = null;
      if (haveAnalyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        // barCount로 downsample
        const step = Math.max(1, Math.floor(data.length / barCount));
        values = Array.from({ length: barCount }).map((_, i) => {
          const start = i * step;
          let sum = 0;
          let n = 0;
          for (let j = start; j < Math.min(start + step, data.length); j++) {
            sum += data[j];
            n++;
          }
          return n ? sum / n / 255 : 0;
        });
      } else if (idle) {
        const t = performance.now() / 1000;
        values = phases.map((p, i) => {
          const x = i / (barCount - 1);
          const wave = Math.sin(t * p.speed + p.phase) * 0.5 + 0.5; // 0..1
          // 가운데가 더 크게, 양끝은 조금 작게 (시각적으로 “믹서” 느낌)
          const centerBoost = 0.55 + 0.45 * Math.sin(Math.PI * x);
          return Math.min(1, Math.max(0, (p.bias + wave * 0.85) * centerBoost));
        });
      }

      if (values) {
        const paddingX = 14;
        const gap = 4;
        const barW = Math.max(3, (w - paddingX * 2 - gap * (barCount - 1)) / barCount);

        const grad = ctx2d.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, "rgba(74,222,128,0.95)"); // green
        grad.addColorStop(0.55, "rgba(59,130,246,0.85)"); // blue
        grad.addColorStop(1, "rgba(207,99,255,0.65)"); // purple

        ctx2d.shadowColor = "rgba(125,255,143,0.18)";
        ctx2d.shadowBlur = 14;
        ctx2d.fillStyle = grad;

        for (let i = 0; i < barCount; i++) {
          const v = values[i] ?? 0;
          const bh = Math.max(6, v * (h - 18));
          const x = paddingX + i * (barW + gap);
          const y = h - bh - 10;

          // 간단한 라운드 느낌 (위쪽만 살짝 둥글게)
          const r = Math.min(6, barW / 2);
          ctx2d.beginPath();
          ctx2d.moveTo(x, y + r);
          ctx2d.arcTo(x, y, x + r, y, r);
          ctx2d.arcTo(x + barW, y, x + barW, y + r, r);
          ctx2d.lineTo(x + barW, h);
          ctx2d.lineTo(x, h);
          ctx2d.closePath();
          ctx2d.fill();
        }
      }

      // 얇은 하이라이트 라인
      ctx2d.shadowBlur = 0;
      ctx2d.strokeStyle = "rgba(255,255,255,0.10)";
      ctx2d.strokeRect(0.5, 0.5, w - 1, h - 1);

      rafRef.current = window.requestAnimationFrame(draw);
    };

    rafRef.current = window.requestAnimationFrame(draw);

    const onResize = () => {
      // 다음 프레임에서 자연스럽게 resize 반영
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      try {
        srcRef.current?.disconnect();
      } catch { }
      try {
        analyserRef.current?.disconnect();
      } catch { }

      srcRef.current = null;
      analyserRef.current = null;

      // 페이지를 떠날 때만 닫히므로 안전
      audioCtxRef.current?.close().catch(() => { });
      audioCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef, height, barCount, idle, phases]);

  return (
    <div
      aria-hidden
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.28)",
        backdropFilter: "blur(8px)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

