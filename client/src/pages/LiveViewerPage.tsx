import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Room, RoomEvent } from "livekit-client";
import { fetchLiveKitToken } from "../api/liveApi";
import DJPlayModePage from "../pages/DJPlayModePage";

export default function LiveViewerPage() {
  const { channel } = useParams<{ channel: string }>();
  const nav = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const channelRef = useRef<Room | null>(null);

  const join = async () => {
    if (!channel || joined || joining) return;
    setJoining(true);
    setIsEnded(false);
    setNotFound(false);

    try {
      const { token, url } = await fetchLiveKitToken(channel, "VIEWER");

      const lkChannel = new Room({});
      channelRef.current = lkChannel;

      lkChannel.on(RoomEvent.TrackSubscribed, (track: any) => {
        console.log("[LiveViewer] Track subscribed:", track.kind);
        if (track.kind === "audio") {
          if (audioRef.current) {
            track.attach(audioRef.current);
            audioRef.current.play().catch((e: any) => console.error("[LiveViewer] Play failed", e));
          }
        }
      });

      lkChannel.on(RoomEvent.Disconnected, () => {
        console.log("[LiveViewer] Disconnected");
        setJoined(false);
        setIsEnded(true);
      });

      lkChannel.on(RoomEvent.ParticipantDisconnected, () => {
        // If the DJ leaves, the room might stay open but empty.
        // We consider it ended if no remote participants remain.
        if (lkChannel.remoteParticipants.size === 0) {
          console.log("[LiveViewer] DJ left -> Ended");
          setJoined(false);
          setIsEnded(true);
        }
      });

      await lkChannel.connect(url, token);
      console.log("[LiveViewer] Connected to room:", lkChannel.name);

      // Check if room is active (has DJ)
      if (lkChannel.remoteParticipants.size === 0) {
        console.log("[LiveViewer] Room is empty -> Not Active");
        lkChannel.disconnect();
        channelRef.current = null;
        setJoined(false);
        setNotFound(true);
        return;
      }

      // autoplay 보강
      audioRef.current?.play().catch(() => { });

      setJoined(true);
    } catch (e) {
      console.error("Failed to join:", e);
      channelRef.current?.disconnect();
      channelRef.current = null;
      setJoined(false);

      // Invalid channel handling
      setNotFound(true);
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

      {/* 입장 UI 오버레이: joined 상태가 아닐 때만 표시 (Live Ended 상태 포함) */}
      {!joined && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,0.5)",
            pointerEvents: "auto",
            backdropFilter: "blur(4px)",
            zIndex: 100
          }}
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

          {/* 2. 채널 없음 팝업 */}
          {notFound && (
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
              <h2 style={{ margin: "0 0 16px", fontSize: "22px", fontWeight: 700, color: "#ff4d4d" }}>
                Channel Inactive
              </h2>
              <p style={{ margin: "0 0 24px", color: "#aaa", lineHeight: "1.5" }}>
                The channel <strong style={{ color: "#fff" }}>{channel}</strong> is not currently active.
              </p>
              <button
                onClick={() => nav("/")}
                style={{
                  background: "#fff",
                  color: "#000",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                Go Home
              </button>
            </div>
          )}

          {/* 3. 입장 버튼 (종료되지 않았고, 찾지 못한 것도 아니고, 입장 전일 때) */}
          {!isEnded && !notFound && (
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
      )}
    </div>
  );
}