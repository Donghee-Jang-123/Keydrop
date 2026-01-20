
import React, { type ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStore } from '../store/authStore';
import WaveformBar from '../components/audio/WaveformBar';
import DeckPanel from '../components/audio/DeckPanel';
import MixerPanel from '../components/audio/MixerPanel';
import SaveRecordingModal from './modals/SaveRecordingModal';
import profileImg from '../assets/profile.png';

interface DJLayoutProps {
    deck1Meta: {
        title: string;
        artist: string;
        bpm: number;
        time: string;
        duration: string;
    };
    deck2Meta: {
        title: string;
        artist: string;
        bpm: number;
        time: string;
        duration: string;
    };
    masterBpm: number;
    isRecording: boolean;
    onLogout: () => void;
    onToggleLive: () => void;
    onToggleRecord: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    libraryElement: ReactNode;
    headerExtra?: ReactNode;

    showSaveModal?: boolean;
    onCloseSaveModal?: () => void;
    onSaveRecording?: (filename: string) => void;
}

const DJLayout: React.FC<DJLayoutProps> = ({
    deck1Meta,
    deck2Meta,
    masterBpm,
    isRecording,
    onLogout,
    onToggleLive,
    onToggleRecord,
    fileInputRef,
    onFileChange,
    libraryElement,
    headerExtra,
    showSaveModal,
    onCloseSaveModal,
    onSaveRecording,
}) => {
    const nav = useNavigate();
    const [isAuthed, setIsAuthed] = useState(authStore.isAuthed());
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        // Simple check on mount, could sub to store if it had listeners
        setIsAuthed(authStore.isAuthed());
    }, []);

    return (
        <div className="kd">
            <header className="kdTop">
                <div className="kdTop__brand">
                    <div className="kdLogo">
                        KEY<span className="kdLogo__accent">DROP</span>
                    </div>
                    <div className="kdTop__tagline">Turn your keyboard into a stage</div>
                    <button type="button" onClick={onLogout}>
                        로그아웃
                    </button>
                </div>

                <div className="kdTop__right">
                    {headerExtra}
                    <button className="kdTop__liveBtn" type="button" onClick={onToggleLive}>
                        LIVE
                    </button>

                    <button
                        className={`kdTop__recBtn ${isRecording ? 'isRecording' : ''}`}
                        type="button"
                        aria-label="Record"
                        onClick={onToggleRecord}
                    />

                    {/* Profile Icon with Tooltip */}
                    <div
                        onClick={() => nav(isAuthed ? "/profile" : "/login")}
                        style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <button className="kdTop__user" type="button" aria-label="User" style={{ pointerEvents: 'none' }}>
                            {/* Simple Avatar or Icon */}
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                <img
                                    src={profileImg}
                                    alt="avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        </button>

                        {!isAuthed && showTooltip && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: 8,
                                background: '#1E1E1E',
                                color: '#eee',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                zIndex: 100
                            }}>
                                Please login
                            </div>
                        )}
                    </div>
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
                style={{ display: 'none' }}
                onChange={onFileChange}
            />

            <section className="kdLibrary" aria-label="Library" id="library-container">
                {libraryElement}
            </section>

            <SaveRecordingModal
                isOpen={!!showSaveModal}
                onCancel={() => onCloseSaveModal?.()}
                onSave={(filename) => onSaveRecording?.(filename)}
            />
        </div>
    );
};

export default DJLayout;
