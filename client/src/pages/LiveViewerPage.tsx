import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Room } from "livekit-client";
import { fetchLiveKitToken } from "../api/liveApi";

export default function LiveViewerPage() {
  const { room } = useParams<{ room: string }>();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const roomRef = useRef<Room | null>(null);

  const join = async () => {
    if (!room || joined || joining) return;
    setJoining(true);

    try {
      const { token, url } = await fetchLiveKitToken(room, "VIEWER");

      const lkRoom = new Room();
      roomRef.current = lkRoom;

      lkRoom.on("trackSubscribed", (track) => {
        if (track.kind !== "audio") return;

        const el = track.attach() as HTMLMediaElement;
        const src = el.srcObject;

        if (audioRef.current && src) {
          audioRef.current.srcObject = src;
          audioRef.current.play().catch(() => {});
        }
      });

      await lkRoom.connect(url, token);

      // autoplay 보강: connect 직후에도 한번 play 시도
      audioRef.current?.play().catch(() => {});

      setJoined(true);
    } catch (e) {
      console.error(e);
      // 실패하면 다시 시도할 수 있게
      roomRef.current?.disconnect();
      roomRef.current = null;
      setJoined(false);
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    return () => {
        roomRef.current?.disconnect();
        roomRef.current = null;
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0b0b0b", color: "#fff" }}>
      <audio ref={audioRef} autoPlay playsInline />

      {/* 여기 배경에 DJPlayModePage readonly를 깔거나, showeffect 오버레이만 둬도 됨 */}
      <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center" }}>
        {!joined ? (
          <button
            onClick={join}
            disabled={!room || joining}
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
        ) : (
          <div style={{ opacity: 0.8 }}>라이브 시청 중</div>
        )}
      </div>
    </div>
  );
}