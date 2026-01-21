import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Room } from "livekit-client";
import { fetchLiveKitToken } from "../api/liveApi";
import DJPlayModePage from "../pages/DJPlayModePage";

export default function LiveViewerPage() {
  const { channel } = useParams<{ channel: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const channelRef = useRef<Room | null>(null);

  const join = async () => {
    if (!channel || joined || joining) return;
    setJoining(true);

    try {
      const { token, url } = await fetchLiveKitToken(channel, "VIEWER");

      const lkChannel = new Room({
      });
      channelRef.current = lkChannel;

      lkChannel.on("trackSubscribed", (track: any) => {
        if (track?.kind !== "audio") return;

        const el = track.attach() as HTMLMediaElement;
        const src = (el as any).srcObject;

        if (audioRef.current && src) {
          audioRef.current.srcObject = src;
          audioRef.current.play().catch(() => {});
        }
      });

      await lkChannel.connect(url, token);

      // autoplay 보강 (브라우저 정책 때문에 실패해도 OK)
      audioRef.current?.play().catch(() => {});

      setJoined(true);
    } catch (e) {
      console.error(e);
      channelRef.current?.disconnect();
      channelRef.current = null;
      setJoined(false);
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    return () => {
      channelRef.current?.disconnect();
      channelRef.current = null;
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0b0b0b", color: "#fff" }}>
      <audio ref={audioRef} autoPlay playsInline />

      {/* joined 되면 DJ 화면을 “배경으로만” 깔기 (조작 불가) */}
      {joined && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <DJPlayModePage />
        </div>
      )}

      {/* 입장 UI 오버레이 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: joined ? "transparent" : "rgba(0,0,0,0.35)",
          pointerEvents: "auto", // 버튼 클릭 가능해야 함
        }}
      >
        {!joined ? (
          <button
            onClick={join}
            disabled={!channel || joining}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: joining ? "not-allowed" : "pointer",
            }}
          >
            {joining ? "입장 중..." : "입장하기"}
          </button>
        ) : null}
      </div>
    </div>
  );
}