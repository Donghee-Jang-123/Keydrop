import { useEffect, useRef, useState } from 'react';
import { useKeyManager } from '../hooks/useKeyManager';
import { audioEngine } from '../services/audioEngine';
import { useDJStore } from '../store/useDJStore';
import { fetchMusicBlobByUrl } from '../api/musicApi';
import { uploadRecording } from '../api/recordingApi';
import { useNavigate } from 'react-router-dom';
import { logout } from "../api/authApi";
import DeckPanel from '../components/DeckPanel';
import MixerPanel from '../components/MixerPanel';
import LibraryPanel from '../components/LibraryPanel';
import WaveformBar from '../components/WaveformBar';

function fmtTime(sec: number | undefined) {
  const s = Math.max(0, Math.floor(sec ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export default function DJPlayModePage() {
  const nav = useNavigate();
  useKeyManager(audioEngine);

  const pendingDbLoad = useDJStore((s) => s.pendingDbLoad);
  const filePickerDeck = useDJStore((s) => s.filePickerDeck);

  const {
    clearLocalFileRequest,
    setTrackTitle,
    setPlayState,
    toggleFxTargetDeck,
    setDeckMetaFromDb,
    clearDbLoadRequest,
    setPositionSec,
    setDurationSec,
    setCues,
  } = useDJStore((s) => s.actions);

  const deck1 = useDJStore((s) => s.deck1);
  const deck2 = useDJStore((s) => s.deck2);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingDeckRef = useRef<1 | 2 | null>(null);

  const cross = useDJStore((s) => s.crossFader);

  const [masterBpm, setMasterBpm] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!filePickerDeck) return;
    pendingDeckRef.current = filePickerDeck;
    fileInputRef.current?.click();
  }, [filePickerDeck]);

  useEffect(() => {
    if (!pendingDbLoad) return;

    const { deckIdx, track, nonce: _nonce } = pendingDbLoad;
    let cancelled = false;

    (async () => {
      try {
        setPlayState(deckIdx, false);

        if (!track.mp3Url) throw new Error('track.mp3Url is missing');

        const blob = await fetchMusicBlobByUrl(track.mp3Url);

        const name = `${track.title ?? 'track'}.mp3`;
        const file = new File([blob], name, { type: blob.type || 'audio/mpeg' });
        audioEngine.decks[deckIdx].loadFile(file, track.bpm ?? 0);

        setDeckMetaFromDb(deckIdx, {
          title: track.title ?? 'Unknown',
          artist: track.artists ?? '',
          bpm: track.bpm ?? 0,
          durationSec: track.duration ?? 0,
          coverUrl: track.imageUrl ?? null,
        });
        setTrackTitle(deckIdx, track.title ?? name);
      } catch (err) {
        console.error('[pendingDbLoad] failed', err);
      } finally {
        if (!cancelled) clearDbLoadRequest();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingDbLoad, setPlayState, setDeckMetaFromDb, setTrackTitle, clearDbLoadRequest]);

  useEffect(() => {
    const tick = () => {
      const s1 = audioEngine.peekDeckState(1);
      const s2 = audioEngine.peekDeckState(2);

      if (s1) {
        setPositionSec(1, s1.positionSec);
        setDurationSec(1, s1.durationSec);
        setCues(1, s1.cues ?? {});
      }

      if (s2) {
        setPositionSec(2, s2.positionSec);
        setDurationSec(2, s2.durationSec);
        setCues(2, s2.cues ?? {});
      }

      if (!s1 && !s2) return;

      const a1 = audioEngine.getAnalyzedBpm(1);
      const a2 = audioEngine.getAnalyzedBpm(2);

      let bpm = 0;

      if (s1?.isPlaying && !s2?.isPlaying && a1) {
        bpm = a1 * s1.playbackRate;
      } else if (!s1?.isPlaying && s2?.isPlaying && a2) {
        bpm = a2 * s2.playbackRate;
      } else if (s1?.isPlaying && s2?.isPlaying) {
        const useDeck2 = cross >= 0;
        if (useDeck2 && a2) bpm = a2 * s2.playbackRate;
        if (!useDeck2 && a1) bpm = a1 * s1.playbackRate;
      }

      setMasterBpm((prev) =>
        Math.abs(prev - bpm) > 0.1 ? bpm : prev
      );
      
    };

    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [cross]);

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

  return (
    <div className="kd">
      <header className="kdTop">
        <div className="kdTop__brand">
          <div className="kdLogo">
            KEY<span className="kdLogo__accent">DROP</span>
          </div>
          <div className="kdTop__tagline">Turn your keyboard into a stage</div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              nav("/login");
            }}
          >
            로그아웃
          </button>
        </div>

        <div className="kdTop__right">

          <button className="kdTop__liveBtn" type="button" onClick={toggleFxTargetDeck}>
            LIVE
          </button>

          <button
            className={`kdTop__recBtn ${isRecording ? 'isRecording' : ''}`}
            type="button"
            aria-label="Record"
            onClick={async () => {
              try {
                if (!audioEngine.recorder.isRecording()) {
                  await audioEngine.recorder.start();
                  setIsRecording(true);
                  return;
                }

                const blob = await audioEngine.recorder.stop();
                setIsRecording(false);

                const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';
                const name = `keydrop-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
                const file = new File([blob], name, { type: blob.type || `audio/${ext}` });

                await uploadRecording(file);
              } catch (err) {
                console.error('[record] failed', err);
                setIsRecording(audioEngine.recorder.isRecording());
              }
            }}
          />
          <button
            className="kdTop__user"
            type="button"
            aria-label="User"
            onClick={() => nav("/my-profile")}
          >
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
        <DeckPanel deckIdx={1} side="left" meta={deck1Meta} />
        <MixerPanel masterBpm={masterBpm}/>
        <DeckPanel deckIdx={2} side="right" meta={deck2Meta} />
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const deck = pendingDeckRef.current;
          const file = e.target.files?.[0];
          e.currentTarget.value = '';

          clearLocalFileRequest();
          pendingDeckRef.current = null;
          if (!deck || !file) return;

          try {
            setPlayState(deck, false);
            setTrackTitle(deck, file.name);
            audioEngine.decks[deck].loadFile(file, 0);
          } catch (err) {
            console.error('[loadFile] failed', err);
          }
        }}
      />

      <section className="kdLibrary" aria-label="Library">
        <LibraryPanel />
      </section>
    </div>
  );
}