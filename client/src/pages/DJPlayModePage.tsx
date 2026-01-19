import { useEffect, useRef } from 'react';
import { useInputManager } from '../hooks/useInputManager';
import { audioEngine } from '../services/audioEngine';
import { useDJStore } from '../store/useDJStore';
import { fetchMusicBlobByUrl } from '../api/musicApi';
import DeckPanel from '../components/DeckPanel';
import MixerPanel from '../components/MixerPanel';
import LibraryPanel from '../components/LibraryPanel';

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

  const deck1Meta = {
    title: deck1.trackTitle,
    artist: deck1.artist ?? '',
    bpm: deck1.trackBpm ?? 0,
    time: '0:00',
    duration: deck1.durationSec ? `0:00 / ${Math.floor(deck1.durationSec / 60)}:${String(deck1.durationSec % 60).padStart(2, '0')}` : '-',
  };

  const deck2Meta = {
    title: deck2.trackTitle,
    artist: deck2.artist ?? '',
    bpm: deck2.trackBpm ?? 0,
    time: '0:00',
    duration: deck2.durationSec ? `0:00 / ${Math.floor(deck2.durationSec / 60)}:${String(deck2.durationSec % 60).padStart(2, '0')}` : '-',
  };

  return (
    <div className="kd">
      <header className="kdTop">
        <div className="kdTop__brand">
          <div className="kdLogo">
            Key<span className="kdLogo__accent">DROP</span>
          </div>
          <div className="kdTop__tagline">Turn your keyboard into a stage</div>
        </div>

        <div className="kdTop__right">
          <div className="kdTop__kbdPlaceholder" aria-hidden="true" />

          <button className="kdTop__liveBtn" type="button" onClick={toggleFxTargetDeck}>
            LIVE (Deck {fxTargetDeck})
          </button>

          <button className="kdTop__recBtn" type="button" aria-label="Record" />
          <button className="kdTop__user" type="button" aria-label="User">
            ⦿
          </button>
        </div>
      </header>

      <section className="kdWavePlaceholder" aria-label="Waveform placeholder" />

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