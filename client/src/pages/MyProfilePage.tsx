import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, logout } from "../api/authApi";
import profileImg from "../assets/profile.png";

type Me = {
  email: string;
  nickname: string | null;
  djLevel?: string;
};

type RecordingItem = {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  durationSec?: number;
  fileUrl: string;
};

function fmtDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MyProfilePage() {
  const nav = useNavigate();
  const [items, setItems] = useState<RecordingItem[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, recRes] = await Promise.allSettled([
          api.get<Me>("/api/users/me"),
          api.get<RecordingItem[]>("/api/recordings"),
        ]);

        if (meRes.status === "fulfilled") {
          setMe(meRes.value.data);
        }
        if (recRes.status === "fulfilled") {
          setItems(Array.isArray(recRes.value.data) ? recRes.value.data : []);
        }
      } catch (e) {
        console.error("Failed to load profile data", e);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [items]);

  const togglePlay = (id: number) => {
    const audioEl = document.getElementById(`audio-${id}`) as HTMLAudioElement;
    if (!audioEl) return;

    if (playingId === id) {
      audioEl.pause();
      setPlayingId(null);
    } else {
      // Pause currently playing if any
      if (playingId) {
        const prev = document.getElementById(`audio-${playingId}`) as HTMLAudioElement;
        prev?.pause();
      }
      audioEl.play().catch(e => console.error("Play failed", e));
      setPlayingId(id);
    }
  };

  return (
    <div className="kd" style={{ background: "#2C2C2C", minHeight: "100vh", color: "white", fontFamily: "Inter, sans-serif" }}>
        <header className="kdTop">
        <div className="kdTop__brand" style={{ display: "flex", alignItems: "center" }}>
          <div className="auth-logo" onClick={() => nav("/dj")}>Key<span>DROP</span></div>
          <div
            style={{
              marginLeft: 8,
              color: "#9a9a9a",
              fontSize: 13,
              letterSpacing: "0.2px",
              userSelect: "none",
            }}
          >
            Turn your keyboard into a stage
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>

        {/* Profile Card */}

        <div style={{
          position: "relative",
          background: "#1E1E1E",
          borderRadius: 16,
          padding: 32,
          display: "flex",
          gap: 24,
          alignItems: "center",
          marginBottom: 32,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        }}>
                  <div
          onClick={async () => {
            await logout();
            nav("/");
          }}
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 16,
            color: "#9a9a9a",
            cursor: "pointer",
            opacity: 0.85,
            userSelect: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
        >
          <i className="fa-solid fa-right-from-bracket" />
          Logout
        </div>
          {/* Avatar Section */}
          <div style={{
            width: 120,
            height: 120,
            borderRadius: 16,
            overflow: "hidden",
            background: "#333",
            flexShrink: 0
          }}>
            <img
              src={profileImg}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* User Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
              {me?.nickname || "DJ User"}
            </h1>
            <div style={{ color: "#A3A3A3", fontSize: 16 }}>
              {me?.email || "user@example.com"}
            </div>
            <div style={{
              marginTop: 8,
              fontSize: 18,
              color: "#E5E5E5"
            }}>
              {me?.djLevel || "Expert"}
            </div>
          </div>
        </div>

        {/* Recordings List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {sorted.map((item) => (
            <div key={item.id} style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              gap: 20
            }}>
              <button
                onClick={() => togglePlay(item.id)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#fff"
                }}
              >
                {playingId === item.id ? "⏸" : "▶"}
              </button>

              <div style={{ flex: 1, fontWeight: 500, fontSize: 16 }}>
                {item.fileName}
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#A3A3A3"
              }}>
                <div style={{ minWidth: 60, textAlign: "right" }}>
                  {item.durationSec != null ? fmtDuration(item.durationSec) : "--:--"}
                </div>

                <div style={{ minWidth: 160, textAlign: "right" }}>
                  {fmtDate(item.createdAt)}
                </div>
              </div>

              {/* Hidden Audio Element */}
              <audio
                id={`audio-${item.id}`}
                src={item.fileUrl}
                preload="metadata"
                onLoadedMetadata={(e) => {
                  const dur = (e.currentTarget as HTMLAudioElement).duration;
                  if (!Number.isFinite(dur)) return;
                  setItems((prev) =>
                    prev.map((x) => (x.id === item.id ? { ...x, durationSec: Math.floor(dur) } : x))
                  );
                }}
                onEnded={() => setPlayingId(null)}
              />
            </div>
          ))}

          {sorted.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
              No recordings yet. Go to DJ mode and mix something!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
