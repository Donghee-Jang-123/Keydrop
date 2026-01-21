import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Room } from "livekit-client";
import { fetchLiveKitToken } from "../api/liveApi";
import DJPlayModePage from "../pages/DJPlayModePage";

export default function LiveViewerPage() {
  const { channel } = useParams<{ channel: string }>();
  const nav = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const channelRef = useRef<Room | null>(null);

  const join = async () => {
    if (!channel || joined || joining) return;
    setJoining(true);
    setIsEnded(false); // reset

    try {
      const { token, url } = await fetchLiveKitToken(channel, "VIEWER");

      const lkChannel = new Room({});
      channelRef.current = lkChannel;

      lkChannel.on("trackSubscribed", (track: any) => {
        if (track?.kind !== "audio") return;

        const el = track.attach() as HTMLMediaElement;
        const src = (el as any).srcObject;

        if (audioRef.current && src) {
          audioRef.current.srcObject = src;
          audioRef.current.play().catch(() => { });
        }
      });

      lkChannel.on("disconnected", () => {
        setJoined(false);
        setIsEnded(true);
      });

      await lkChannel.connect(url, token);

      // autoplay 보강 (브라우저 정책 때문에 실패해도 OK)
      audioRef.current?.play().catch(() => { });

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
          <DJPlayModePage viewerMode={true} />
        </div>
      )}

      {/* 입장 UI 오버레이 */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "rgba(0,0,0,0.5)",
          pointerEvents: "auto",
          backdropFilter: joined ? "none" : "blur(4px)",
          transition: "backdrop-filter 0.5s ease",
          zIndex: 100
        }}
        // joined 상태면(방송중) 클릭이 DJ화면(있다면)으로 전달되지 않게 막아야 하나?
        // 아니, viewerMode=true면 어차피 조작 불가임.
        // 그리고 joined=true일 때 이 오버레이가 사라져야 함 (pointerEvents="none")
        // 단, joined=true여도 isEnded=true면 떠야 함.
        hidden={joined}
      >
        {/* 1. 방송 종료 팝업 */}
        {isEnded && (
          <div style={{
            background: "#1E1E1E",
            padding: "32px",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            maxWidth: "400px",
            width: "90%"
          }}>
            <h2 style={{ margin: "0 0 16px", fontSize: "22px", fontWeight: 700 }}>
              The live stream has ended.
            </h2>
            <p style={{ margin: "0 0 24px", color: "#aaa", lineHeight: "1.5" }}>
              Why not try KeyDROP yourself?
            </p>
            <button
              onClick={() => nav("/")}
              style={{
                background: "#4ADE80",
                color: "#111",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%"
              }}
            >
              Try KeyDROP
            </button>
          </div>
        )}

        {/* 2. 입장 버튼 (종료되지 않았고, 입장 전일 때) */}
        {!joined && !isEnded && (
          <button
            onClick={join}
            disabled={!channel || joining}
            style={{
              padding: "16px 32px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              fontSize: "18px",
              fontWeight: 600,
              cursor: joining ? "not-allowed" : "pointer",
              transition: "transform 0.2s, background 0.2s"
            }}
          >
            {joining ? "Entering..." : "Enter Channel"}
          </button>
        )}
      </div>
    </div>
  );
}