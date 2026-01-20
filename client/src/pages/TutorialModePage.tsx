
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DJLayout from '../components/DJLayout';
import LibraryPanel from '../components/audio/LibraryPanel';
import { useDJStore } from '../store/useDJStore';
import { audioEngine } from '../services/audioEngine';
import { useKeyManager } from '../hooks/useKeyManager';
import { fetchMusicBlobByUrl } from '../api/musicApi';

// 튜토리얼용 더미 데이터
const TUTORIAL_TRACKS = [
    {
        musicId: 'tutorial-1',
        title: 'Revenger',
        artists: 'Raiko',
        bpm: 150,
        duration: 182,
        mp3Url: '/media/Revenger.mp3',
        imageUrl: '/media/Revenger.png',
        genre: 'Dubstep'
    },
    {
        musicId: 'tutorial-2',
        title: 'Losing Control',
        artists: 'JPB, Mendum & Marvin Divine',
        bpm: 155,
        duration: 187,
        mp3Url: '/media/Losing Control.mp3',
        imageUrl: '/media/Losing Control.png',
        genre: 'Trap'
    }
];

// 튜토리얼 스텝 정의
interface TutorialStep {
    id: number;
    instruction: React.ReactNode;
    allowedKeys: string[];
    focusIds: string[]; // 하이라이트할 Element ID 목록
    checkCompletion: (state: any, audioEngine: any, stepState: any) => boolean;
}

const STEPS: TutorialStep[] = [
    {
        id: 1,
        instruction: <>Press <b style={{ color: 'var(--green)' }}>Tab</b>{' '}to select a track, then press{' '}<b style={{ color: 'var(--green)' }}>LeftShift</b>{' '}to <b>load</b>{' '}the track into <b>Deck1</b>.</>,
        allowedKeys: ['TAB', 'SHIFTLEFT'],
        focusIds: ['library-container'],
        checkCompletion: (s) => s.deck1.trackTitle === "Revenger" || s.deck1.trackTitle === "Losing Control"
    },
    {
        id: 2,
        instruction: <>Press <b style={{ color: 'var(--green)' }}>G</b>{' '}to <b>play</b>{' '}<b>Deck1</b>.</>,
        allowedKeys: ['G'],
        focusIds: ['deck-1-container'],
        checkCompletion: (_s, engine) => {
            const d1 = engine.peekDeckState(1);
            return d1 && d1.isPlaying;
        }
    },
    {
        id: 3,
        instruction: <>Press <b style={{ color: 'var(--green)' }}>1</b>{' '}to <b>save</b>{' '}the position to <b>Cue1</b>{' '}of <b>Deck1</b>, then press{' '}<b style={{ color: 'var(--green)' }}>1</b>{' '}several times to <b>jump</b>{' '}to that cue point whenever you want.</>,
        allowedKeys: ['1'],
        focusIds: ['deck-1-container'],
        checkCompletion: (_s, engine, stepState) => {
            const d1 = engine.peekDeckState(1);
            const cueSet = d1 && d1.cues && (d1.cues[1] !== undefined);

            // Wait for 4 jumps
            return cueSet && (stepState.jumpCount || 0) >= 4;
        }
    },
    {
        id: 4,
        instruction: <>Press <b style={{ color: 'var(--green)' }}>Tab</b>{' '}to select a track, then press{' '}<b style={{ color: 'var(--cyan)' }}>Right Shift</b>{' '}to <b>load</b>{' '}the track into <b>Deck 2</b>.</>,
        allowedKeys: ['TAB', 'SHIFTRIGHT'],
        focusIds: ['library-container'],
        checkCompletion: (s) => !!s.deck2.trackTitle
    },
    {
        id: 5,
        instruction: <>Hold <b style={{ color: 'var(--cyan)' }}>;</b>{' '}to lower the <b>Bass</b>{' '}of <b>Deck2</b>, and hold{' '}<b style={{ color: 'var(--cyan)' }}>J</b>{' '}to lower the <b>Fader</b>{' '}of <b>Deck2</b>.</>,
        allowedKeys: [';', 'J'],
        focusIds: ['deck-2-container', 'mixer-container'], // Multi-highlight
        checkCompletion: (s) => s.deck2.mid < 0.45 && s.deck2.fader < 0.8
    },
    {
        id: 6,
        instruction: <>Hold <b style={{ color: 'var(--green)' }}>V</b>{' '}to <b>scratch</b>{' '}on <b>Deck1</b>, then press{' '}<b style={{ color: 'var(--cyan)' }}>H</b>{' '}to <b>play</b>{' '}<b>Deck2</b>.</>,
        allowedKeys: ['V', 'H', 'G'],
        focusIds: ['deck-1-container', 'deck-2-container'], // Scratch D1, Play D2
        checkCompletion: (_s, engine, stepState) => {
            const d2 = engine.peekDeckState(2);
            // Must have scratched Deck 1 (via stepState) AND Deck 2 must be playing
            return (stepState.scratched === true) && (d2 && d2.isPlaying);
        }
    },
    {
        id: 7,
        instruction: <>Hold the <b style={{ color: 'var(--green)' }}>Right Arrow</b>{' '}key to move the <b>crossfader</b>{' '}to the right, and Hold{' '}<b style={{ color: 'var(--green)' }}>F</b>{' '}to lower the <b>Fader</b>{' '}of <b>Deck1</b>, and hold{' '}<b style={{ color: 'var(--cyan)' }}>U</b>{' '}to raise the <b>Fader</b>{' '}of <b>Deck2</b>.</>,
        allowedKeys: ['ARROWRIGHT', 'F', 'U'],
        focusIds: ['deck-1-container', 'mixer-container', 'deck-2-container'], // All relevant areas
        checkCompletion: (s) => s.crossFader > 0.8 && s.deck1.fader < 0.2 && s.deck2.fader > 0.8
    },
    {
        id: 8,
        instruction: <>Press <b style={{ color: 'var(--cyan)' }}>NumEnter</b>{' '}to select <b>Deck2</b>, then press{' '}<b style={{ color: 'var(--cyan)' }}>Num2</b>{' '}to apply the <b>Flanger FX</b>{' '}effect.</>,
        allowedKeys: ['NUMPADENTER', 'NUMPAD2'],
        focusIds: ['deck-2-container'],
        checkCompletion: (s) => s.deck2.fx === 'FLANGER'
    },
    {
        id: 9,
        instruction: "All key mappings can be found in the top-right corner of DJ Mode.",
        allowedKeys: [],
        focusIds: ['header-right'],
        checkCompletion: () => false
    },
    {
        id: 10,
        instruction: "Enjoy our Service!",
        allowedKeys: [],
        focusIds: ['kd'],
        checkCompletion: () => false
    }
];

function fmtTime(sec: number | undefined) {
    const s = Math.max(0, Math.floor(sec ?? 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
}

export default function TutorialModePage() {
    const nav = useNavigate();
    const [currentStepIdx, setStepIdx] = useState(0);
    const currentStep = STEPS[currentStepIdx];

    // Ref for tracking extra state (e.g. key press counts)
    const stepState = useRef<any>({});

    // Custom Key Predicate
    const allowKey = (code: string) => {
        return currentStep.allowedKeys.includes(code);
    };

    useKeyManager(audioEngine, allowKey);

    const {
        setTrackTitle,
        setPlayState,
        toggleFxTargetDeck,
        setDeckMetaFromDb,
        clearDbLoadRequest,
        setPositionSec,
        setDurationSec,
        setCues,
        setLibraryTracks
    } = useDJStore((s) => s.actions);

    const pendingDbLoad = useDJStore((s) => s.pendingDbLoad);
    const deck1 = useDJStore((s) => s.deck1);
    const deck2 = useDJStore((s) => s.deck2);
    const cross = useDJStore((s) => s.crossFader);
    const [masterBpm, setMasterBpm] = useState(0);
    const isRecording = false; // Tutorial always false
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Library
    useEffect(() => {
        setLibraryTracks(TUTORIAL_TRACKS as any);
    }, [setLibraryTracks]);

    // Step Completion Checker Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const storeState = useDJStore.getState();

            if (currentStep.checkCompletion(storeState, audioEngine, stepState.current)) {
                // Advance
                if (currentStepIdx < STEPS.length - 1 && currentStep.id <= 8) {
                    setStepIdx(prev => prev + 1);
                    stepState.current = {}; // Reset step state
                }
            }
        }, 200);
        return () => clearInterval(interval);
    }, [currentStepIdx, currentStep]);

    // Step Specific Key Listeners
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            // Step 3: Count Jumps
            if (currentStep.id === 3) {
                if (e.code === 'Digit1' || e.key === '1') {
                    const d1 = audioEngine.peekDeckState(1);
                    const cueSet = d1 && d1.cues && (d1.cues[1] !== undefined);
                    if (cueSet) {
                        stepState.current.jumpCount = (stepState.current.jumpCount || 0) + 1;
                        console.log(`[Tutorial] Step 3 Jump Count: ${stepState.current.jumpCount}`);
                    }
                }
            }
            // Step 6: Detect Scratch
            if (currentStep.id === 6) {
                if (e.code === 'KeyV' || e.key === 'v' || e.key === 'V') {
                    stepState.current.scratched = true;
                    console.log(`[Tutorial] Step 6 Scratched: true`);
                }
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentStep.id]);

    // --- Boilerplate from DJPlayModePage for Engine Sync ---
    useEffect(() => {
        if (!pendingDbLoad) return;
        const { deckIdx, track } = pendingDbLoad;
        let cancelled = false;
        (async () => {
            try {
                setPlayState(deckIdx, false);
                let blob;
                try {
                    if (track.mp3Url) blob = await fetchMusicBlobByUrl(track.mp3Url);
                } catch (e) {
                    console.warn("Tutorial File Load Fake Fail");
                }

                if (cancelled) return;

                // Emulate success for tutorial
                setDeckMetaFromDb(deckIdx, {
                    title: track.title ?? 'Unknown',
                    artist: track.artists ?? '',
                    bpm: track.bpm ?? 0,
                    durationSec: track.duration ?? 0,
                    coverUrl: track.imageUrl ?? null,
                });
                setTrackTitle(deckIdx, track.title ?? 'track');

                if (blob) {
                    const file = new File([blob], `${track.title}.mp3`, { type: 'audio/mpeg' });
                    audioEngine.decks[deckIdx].loadFile(file, track.bpm ?? 0);
                }

                clearDbLoadRequest();

            } catch (err) {
                console.error('[pendingDbLoad] failed', err);
                clearDbLoadRequest();
            }
        })();
        return () => { cancelled = true; };
    }, [pendingDbLoad, setPlayState, setDeckMetaFromDb, setTrackTitle, clearDbLoadRequest]);

    // Tick Loop
    useEffect(() => {
        const tick = () => {
            const s1 = audioEngine.peekDeckState(1);
            const s2 = audioEngine.peekDeckState(2);
            if (s1) { setPositionSec(1, s1.positionSec); setDurationSec(1, s1.durationSec); setCues(1, s1.cues ?? {}); }
            if (s2) { setPositionSec(2, s2.positionSec); setDurationSec(2, s2.durationSec); setCues(2, s2.cues ?? {}); }

            // BPM Logic (Simplified)
            const a1 = audioEngine.getAnalyzedBpm(1);
            const a2 = audioEngine.getAnalyzedBpm(2);
            let bpm = 0;
            if (s1?.isPlaying) bpm = a1 ? a1 * s1.playbackRate : 0;
            else if (s2?.isPlaying) bpm = a2 ? a2 * s2.playbackRate : 0;
            setMasterBpm(bpm);
        };
        const id = setInterval(tick, 100);
        return () => clearInterval(id);
    }, [cross, setPositionSec, setDurationSec, setCues]);

    const deck1Meta = {
        title: deck1.trackTitle,
        artist: deck1.artist ?? '',
        bpm: deck1.trackBpm ?? 0,
        time: fmtTime(deck1.positionSec),
        duration: deck1.durationSec ? fmtTime(deck1.durationSec) : '-',
    };

    const deck2Meta = {
        title: deck2.trackTitle,
        artist: deck2.artist ?? '',
        bpm: deck2.trackBpm ?? 0,
        time: fmtTime(deck2.positionSec),
        duration: deck2.durationSec ? fmtTime(deck2.durationSec) : '-',
    };

    // Overlay Helper (Multi-Rect Support)
    const [focusRects, setFocusRects] = useState<React.CSSProperties[]>([]);

    useEffect(() => {
        const updateFocus = () => {
            if (!currentStep.focusIds || currentStep.focusIds.length === 0) {
                setFocusRects([]);
                return;
            }

            const newRects: React.CSSProperties[] = [];

            // Special case for 'kd' (Whole screen)
            if (currentStep.focusIds.includes('kd')) {
                newRects.push({ top: 0, left: 0, width: '100%', height: '100%', opacity: 0 });
            } else {
                currentStep.focusIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        newRects.push({
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        });
                    }
                });
            }
            setFocusRects(newRects);
        };
        updateFocus();
        window.addEventListener('resize', updateFocus);
        const interval = setInterval(updateFocus, 500); // Poll for layout changes
        return () => {
            window.removeEventListener('resize', updateFocus);
            clearInterval(interval);
        }
    }, [currentStep.focusIds]);

    return (
        <>
            {/* Tutorial Overlay */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 9999,
                    pointerEvents: 'none',
                }}
                className="tutorial-overlay"
            >
                <svg width="100%" height="100%">
                    <defs>
                        <mask id="spotlight-mask">
                            {/* White base = fully opaque mask (hidden content below) */}
                            {/* Wait, mask behavior: white = visible, black = hidden. 
                                We want the OVERLAY to be visible everywhere EXCEPT the hole.
                                So we draw a WHITE rect for full screen (overlay visible),
                                then draw BLACK rects for the holes (overlay transparent).
                            */}
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {/* The Holes */}
                            {focusRects.map((rect, idx) => (
                                <rect
                                    key={idx}
                                    x={rect.left}
                                    y={rect.top}
                                    width={rect.width}
                                    height={rect.height}
                                    rx="16" // Rounded corners
                                    fill="black"
                                />
                            ))}
                        </mask>
                    </defs>
                    <rect
                        x="0" y="0" width="100%" height="100%"
                        fill="rgba(0,0,0,0.7)"
                        mask="url(#spotlight-mask)"
                        style={{ pointerEvents: 'auto' }} // This blocks clicks on the dark area
                    />
                </svg>

                {/* Instruction Card */}
                <div style={{
                    position: 'absolute',
                    top: '17%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    background: 'rgba(20, 20, 20, 0.95)',
                    padding: '30px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center',
                    width: '600px',
                    height: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start', // FIXED: Aligns content to top
                    alignItems: 'center',
                    pointerEvents: 'auto',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'normal', marginTop: 0 }}>
                        <b>Step</b> {currentStep.id}/10
                    </h2>
                    <p style={{
                        fontSize: '18px',
                        lineHeight: '1.6',
                        // FIXED: Reduced margin for last steps to pull button up
                        margin: currentStep.id > 8 ? '0 0 10px 0' : '0 0 20px 0',
                        width: '100%'
                    }}>
                        {currentStep.instruction}
                    </p>
                    {currentStep.id > 8 && (
                        <button
                            onClick={() => {
                                if (currentStep.id < 10) setStepIdx(prev => prev + 1);
                                else nav('/dj');
                            }}
                            style={{
                                marginTop: '5px', // FIXED: Tighter spacing (Total gap ~15px)
                                padding: '10px 0',
                                width: '120px',
                                background: 'var(--green)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#000',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            {currentStep.id === 10 ? 'Finish' : 'Next'}
                        </button>
                    )}
                </div>
            </div>

            <DJLayout
                deck1Meta={deck1Meta}
                deck2Meta={deck2Meta}
                masterBpm={masterBpm}
                isRecording={isRecording}
                onLogout={() => { }} // Disabled in tutorial
                onToggleLive={toggleFxTargetDeck} // Allowed?
                onToggleRecord={() => { }} // Disabled
                fileInputRef={fileInputRef}
                onFileChange={() => { }} // Disabled
                libraryElement={<LibraryPanel fetchOnMount={false} />}
                headerExtra={
                    <button
                        onClick={() => nav('/dj')}
                        style={{
                            marginRight: '20px',
                            padding: '8px 16px',
                            background: '#333',
                            color: '#aaa',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            zIndex: 10000,
                            position: 'relative',
                            pointerEvents: 'auto' // Ensure clickable
                        }}
                    >
                        Skip Tutorial Mode
                    </button>
                }
            />
        </>
    );
}
