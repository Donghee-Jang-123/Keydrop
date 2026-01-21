import React, { type ReactNode, useState, useEffect } from 'react';
import { api } from "../api/authApi";
import { useNavigate } from 'react-router-dom';
import { authStore } from '../store/authStore';
import { useLiveBroadcast } from "../services/useLiveBroadcast";
import { audioEngine } from "../services/audioEngine";
import WaveformBar from './audio/WaveformBar';
import DeckPanel from './audio/DeckPanel';
import MixerPanel from './audio/MixerPanel';
import SaveRecordingModal from './modals/SaveRecordingModal';

interface DJHeaderProps {
  deck1Meta: { title: string; artist: string; bpm: number; time: string; duration: string; };
  deck2Meta: { title: string; artist: string; bpm: number; time: string; duration: string; };
  masterBpm: number;
  isRecording: boolean;
  onToggleRecord: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  libraryElement: ReactNode;
  headerExtra?: ReactNode;
  showSaveModal?: boolean;
  onCloseSaveModal?: () => void;
  onSaveRecording?: (filename: string) => void;
  showSaveSuccess?: boolean;
  onCloseSaveSuccess?: () => void;
  hideLibrary?: boolean;
  viewerMode?: boolean;
}

type Me = { email: string; nickname: string | null };

const LOCK_TIP = "Login and unlock the full experience!";

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      top: "100%",
      right: 0,
      marginTop: 8,
      background: "#1E1E1E",
      color: "#eee",
      padding: "6px 12px",
      borderRadius: 6,
      fontSize: 12,
      whiteSpace: "nowrap",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      zIndex: 100,
      pointerEvents: "none",
    }}
  >
    {text}
  </div>
);

const DJHeader: React.FC<DJHeaderProps> = ({
  deck1Meta,
  deck2Meta,
  masterBpm,
  isRecording,
  onToggleRecord,
  fileInputRef,
  onFileChange,
  libraryElement,
  headerExtra,
  showSaveModal,
  onCloseSaveModal,
  onSaveRecording,
  showSaveSuccess,
  onCloseSaveSuccess,
  hideLibrary,
  viewerMode
}) => {
  const nav = useNavigate();
  console.log("[DJHeader] viewerMode:", viewerMode);

  const [isAuthed, setIsAuthed] = useState(authStore.isAuthed());
  const [me, setMe] = useState<Me | null>(null);

  const { isLive, start, stop } = useLiveBroadcast();

  const [channelName, setChannelName] = useState<string>("");
  const liveUrl = channelName ? `${window.location.origin}/live/${channelName}` : "";
  const [liveBusy, setLiveBusy] = useState(false);

  const [lockTip, setLockTip] = useState<null | "live" | "record" | "profile">(null);
  const canUsePremium = isAuthed;

  useEffect(() => {
    const authed = authStore.isAuthed();
    setIsAuthed(authed);

    if (!authed) return;

    (async () => {
      try {
        const res = await api.get<Me>("/api/users/me");
        setMe(res.data);
      } catch (e) {
        console.error("Failed to load me", e);
      }
    })();
  }, []);

  function makeChannelName() {
    const rand = Math.random().toString(36).slice(2, 8);
    return `dj-${rand}`;
  }

  const onStartLive = async () => {
    if (!canUsePremium) return;
    if (liveBusy || isLive) return;

    setLiveBusy(true);

    const cn = channelName || makeChannelName();
    if (!channelName) setChannelName(cn);

    try {
      const stream = await audioEngine.live.getStream();
      await start(cn, stream);
    } catch (e) {
      console.error(e);
      setChannelName("");
    } finally {
      setLiveBusy(false);
    }
  };

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showEndSuccess, setShowEndSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const confirmEndLive = () => {
    if (!canUsePremium) return;
    stop();
    setChannelName("");
    setShowEndConfirm(false);
    audioEngine.stopAll();
    setShowEndSuccess(true);
  };

  const onEndLive = () => {
    if (!canUsePremium) return;
    setShowEndConfirm(true);
  };

  const onCopyLink = async () => {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      window.prompt("복사해서 공유하세요: ", liveUrl);
    }
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return (
    <div className="kd">
      <header className="kdTop">
        <div className="kdTop__brand">
          <div className="auth-logo" onClick={() => nav("/dj")}>
            Key<span>DROP</span>
          </div>
          <div
            style={{
              marginLeft: 12,
              color: "#9a9a9a",
              fontSize: 15,
              letterSpacing: "0.2px",
              userSelect: "none",
            }}
          >
            Turn your keyboard into a stage
          </div>
        </div>

        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginRight: 12, fontSize: "22px" }}>
            <div style={{ opacity: 0.85 }}>
              Channel: <span style={{ fontWeight: 600 }}>{channelName || "—"}</span>
            </div>
            <div style={{ opacity: 0.85 }}>
              DJ: <span style={{ fontWeight: 600 }}>{me?.nickname || "DJ"}</span>
            </div>
          </div>
        )}

        <div className="kdTop__right" style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {headerExtra}

          {!viewerMode && (
            <>
              {/* Live 버튼 (로그인 잠금 + tooltip) */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => { if (!canUsePremium) setLockTip("live"); }}
                onMouseLeave={() => setLockTip(null)}
              >
                {!isLive ? (
                  <button
                    onClick={canUsePremium ? onStartLive : undefined}
                    disabled={!canUsePremium || liveBusy || isLive}
                    style={{
                      cursor: !canUsePremium ? "not-allowed" : undefined,
                      opacity: !canUsePremium ? 0.5 : 1,
                    }}
                  >
                    {liveBusy ? "Starting..." : "Start Live"}
                  </button>
                ) : (
                  <button
                    onClick={canUsePremium ? onEndLive : undefined}
                    disabled={!canUsePremium}
                    style={{
                      cursor: !canUsePremium ? "not-allowed" : undefined,
                      opacity: !canUsePremium ? 0.5 : 1,
                    }}
                  >
                    End Live
                  </button>
                )}

                {lockTip === "live" && !canUsePremium && <Tooltip text={LOCK_TIP} />}
              </div>

              {isLive && liveUrl && (
                <div style={{ position: "relative" }}>
                  <span
                    onClick={onCopyLink}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      opacity: 0.85,
                      cursor: "pointer",
                      transition: "opacity 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.85")}
                  >
                    Copy a link
                    <i className="fa-regular fa-copy" style={{ fontSize: 14 }} />
                  </span>
                  {linkCopied && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: 8,
                      background: '#333',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 200
                    }}>
                      Link Copied!
                    </div>
                  )}
                </div>
              )}

              {/* Record 버튼 (로그인 잠금 + tooltip) */}
              <div
                style={{ position: "relative", marginLeft: 12, marginRight: 8 }}
                onMouseEnter={() => { if (!canUsePremium) setLockTip("record"); }}
                onMouseLeave={() => setLockTip(null)}
              >
                <button
                  className={`kdTop__recBtn ${isRecording ? "isRecording" : ""}`}
                  type="button"
                  aria-label="Record"
                  onClick={canUsePremium ? onToggleRecord : undefined}
                  disabled={!canUsePremium}
                  style={{
                    cursor: !canUsePremium ? "not-allowed" : undefined,
                    opacity: !canUsePremium ? 0.5 : 1,
                  }}
                />
                {lockTip === "record" && !canUsePremium && <Tooltip text={LOCK_TIP} />}
              </div>

              {/* Profile (로그인 안하면 hover tooltip + 클릭하면 /login) */}
              <div
                onClick={() => nav(isAuthed ? "/profile" : "/login")}
                style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center" }}
                onMouseEnter={() => { if (!isAuthed) setLockTip("profile"); }}
                onMouseLeave={() => setLockTip(null)}
              >
                <i
                  className="fa-solid fa-user"
                  style={{
                    fontSize: 27,
                    color: "#eaeaea",
                  }}
                />
                {!isAuthed && lockTip === "profile" && <Tooltip text={LOCK_TIP} />}
              </div>
            </>
          )}
        </div>
      </header>

      <section className="kdWavePlaceholder" aria-label="Waveform">
        <div className="kdWaveStack">
          <WaveformBar deckIdx={1} variant="top" />
        </div>
      </section>

      <main className="kdMain">
        <div id="deck-1-container">
          <DeckPanel deckIdx={1} side="left" meta={deck1Meta} />
        </div>
        <div id="mixer-container">
          <MixerPanel masterBpm={masterBpm} />
        </div>
        <div id="deck-2-container">
          <DeckPanel deckIdx={2} side="right" meta={deck2Meta} />
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      {!hideLibrary && (
        <section className="kdLibrary" aria-label="Library" id="library-container">
          {libraryElement}
        </section>
      )}

      <SaveRecordingModal
        isOpen={!!showSaveModal}
        onCancel={() => onCloseSaveModal?.()}
        onSave={(filename) => onSaveRecording?.(filename)}
      />

      {/* End Live Confirmation Modal */}
      {showEndConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1E1E1E',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: 12,
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              End Live Stream
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: '#aaaaaa',
              fontSize: '15px',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              Are you sure you want to end the broadcast?<br />
              Viewers will be disconnected.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  background: 'transparent',
                  color: '#AAAAAA',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmEndLive}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#EF4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                End Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Ended Success Modal */}
      {showEndSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1E1E1E',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: 12,
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              Live Ended
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: '#aaaaaa',
              fontSize: '15px',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              The live stream has ended.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowEndSuccess(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#EF4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Saved Success Modal */}
      {showSaveSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1E1E1E',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{
              marginTop: 0,
              marginBottom: 12,
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              Recording Saved
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: '#aaaaaa',
              fontSize: '15px',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              Your recording has been saved.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => onCloseSaveSuccess?.()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#4ADE80',
                  color: 'black',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DJHeader;