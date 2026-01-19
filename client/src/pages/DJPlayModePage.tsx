import { useEffect, useRef } from 'react';
import { useInputManager } from '../hooks/useInputmanager';
import { audioEngine } from '../services/audioEngine';
import DeckPanel from '../components/DeckPanel';
import MixerPanel from '../components/MixerPanel';
import { useDJStore } from '../store/useDJStore';

export default function HomePage() {
  useInputManager(audioEngine);

  const filePickerDeck = useDJStore((s) => s.filePickerDeck);
  const { clearLocalFileRequest, setTrackTitle, setPlayState } = useDJStore.getState().actions;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingDeckRef = useRef<1 | 2 | null>(null);

  useEffect(() => {
    if (!filePickerDeck) return;
    pendingDeckRef.current = filePickerDeck;
    fileInputRef.current?.click();
  }, [filePickerDeck]);

  const deck1Meta = {
    title: 'Lose Control',
    artist: 'alice.km, Molly Mouse',
    bpm: 128,
    time: '1:28',
    duration: '2:40 / 5:19',
  };

  const deck2Meta = {
    title: 'Hypersilent',
    artist: 'Mochakk',
    bpm: 130,
    time: '0:42',
    duration: '2:40 / 5:19',
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
          <button className="kdTop__liveBtn" type="button">
            LIVE
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

      <section className="kdLibraryPlaceholder" aria-label="Library placeholder">
        <div className="kdLibraryPlaceholder__side" />
        <div className="kdLibraryPlaceholder__main" />
      </section>
    </div>
  );
}

