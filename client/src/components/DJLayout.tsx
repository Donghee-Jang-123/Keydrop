
import React, { type ReactNode } from 'react';
import WaveformBar from '../components/audio/WaveformBar';
import DeckPanel from '../components/audio/DeckPanel';
import MixerPanel from '../components/audio/MixerPanel';

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
}) => {
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
                    <button className="kdTop__user" type="button" aria-label="User">
                        ⦿
                    </button>
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
        </div>
    );
};

export default DJLayout;
