import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/authApi";

type RecordingItem = {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  fileUrl: string; // e.g. /api/recordings/{id}/file
};

function fmtBytes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function MyProfilePage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<RecordingItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await api.get<RecordingItem[]>("/api/recordings");

        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("[MyProfilePage] load failed", e);
        if (!cancelled) setError("녹음 목록을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [items]);

  return (
    <div className="kd">
      <header className="kdTop">
        <div className="kdTop__brand">
          <div className="kdLogo">
            KEY<span className="kdLogo__accent">DROP</span>
          </div>
          <div className="kdTop__tagline">My recordings</div>
        </div>

        <div className="kdTop__right">
          <button type="button" className="kdTop__liveBtn" onClick={() => nav("/dj")}>
            DJ로 돌아가기
          </button>
        </div>
      </header>

      <main style={{ padding: 14 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>내 녹음 파일</div>
            <button type="button" className="kdTop__liveBtn" onClick={() => window.location.reload()}>
              새로고침
            </button>
          </div>

          {loading && <div style={{ marginTop: 12, opacity: 0.75 }}>불러오는 중…</div>}
          {error && <div style={{ marginTop: 12, color: "#ff7a7a" }}>{error}</div>}

          {!loading && !error && sorted.length === 0 && (
            <div style={{ marginTop: 12, opacity: 0.75 }}>아직 녹음된 파일이 없어요.</div>
          )}

          {!loading && !error && sorted.length > 0 && (
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {sorted.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.15)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 700 }}>{r.fileName}</div>
                    <div style={{ opacity: 0.75, fontSize: 12 }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                      {r.sizeBytes ? ` · ${fmtBytes(r.sizeBytes)}` : ""}
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <audio controls preload="metadata" src={r.fileUrl} style={{ width: "100%" }} />
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <a
                      href={r.fileUrl}
                      download={r.fileName}
                      style={{ color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}
                    >
                      다운로드
                    </a>
                    <span style={{ opacity: 0.6, fontSize: 12 }}>{r.contentType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

