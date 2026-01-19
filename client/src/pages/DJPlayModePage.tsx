import { useEffect, useRef } from 'react';
import { useInputManager } from '../hooks/useInputManager';
import { audioEngine } from '../services/audioEngine';
import { useDJStore } from '../store/useDJStore';
import { fetchMusicBlobByUrl } from '../api/musicApi';
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
  console.log('[PAGE] DJPlayModePage render');
  useInputManager(audioEngine);

  const fxTargetDeck = useDJStore((s) => s.fxTargetDeck);
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
  } = useDJStore((s) => s.actions);

  const deck1 = useDJStore((s) => s.deck1);
  const deck2 = useDJStore((s) => s.deck2);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingDeckRef = useRef<1 | 2 | null>(null);

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

        if (!track.url) throw new Error('track.url is missing');

        const blob = await fetchMusicBlobByUrl(track.url);

        const name = `${track.title ?? 'track'}.mp3`;
        const file = new File([blob], name, { type: blob.type || 'audio/mpeg' });
        audioEngine.decks[deckIdx].loadFile(file);

        setDeckMetaFromDb(deckIdx, {
          title: track.title ?? 'Unknown',
          artist: track.artists ?? '',
          bpm: track.bpm ?? 0,
          durationSec: track.duration ?? 0,
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

  // 재생 중 positionSec/durationSec를 주기적으로 store에 반영 (playhead + 시간 표시용)
  useEffect(() => {
    const tick = () => {
      const s1 = audioEngine.peekDeckState(1);
      if (s1) {
        setPositionSec(1, s1.positionSec);
        setDurationSec(1, s1.durationSec);
        setPlayState(1, s1.isPlaying);
      }

      const s2 = audioEngine.peekDeckState(2);
      if (s2) {
        setPositionSec(2, s2.positionSec);
        setDurationSec(2, s2.durationSec);
        setPlayState(2, s2.isPlaying);
      }
    };

    // 너무 잦은 렌더를 피하려고 100ms 폴링
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [setPositionSec, setDurationSec, setPlayState]);

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
        </div>

        <div className="kdTop__right">

          <button className="kdTop__liveBtn" type="button" onClick={toggleFxTargetDeck}>
            LIVE
          </button>

          <button className="kdTop__recBtn" type="button" aria-label="Record" />
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
        <DeckPanel deckIdx={1} side="left" meta={deck1Meta} />
        <MixerPanel />
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
            audioEngine.decks[deck].loadFile(file);
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