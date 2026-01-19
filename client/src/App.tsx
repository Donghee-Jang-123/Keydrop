import './App.css';
import { useInputManager } from './hooks/useInputmanager';
import { audioEngine } from './services/audioEngine';
import DeckPanel from './components/DeckPanel';
import MixerPanel from './components/MixerPanel';

function App() {
  useInputManager(audioEngine);

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
          <div className="kdLogo">Key<span className="kdLogo__accent">DROP</span></div>
          <div className="kdTop__tagline">Turn your keyboard into a stage</div>
        </div>
        <div className="kdTop__right">
          {/* 우측 상단 키보드(placeholder) */}
          <div className="kdTop__kbdPlaceholder" aria-hidden="true" />
          <button className="kdTop__liveBtn" type="button">LIVE</button>
          <button className="kdTop__recBtn" type="button" aria-label="Record" />
          <button className="kdTop__user" type="button" aria-label="User">⦿</button>
        </div>
      </header>

      {/* 상단 파형 영역 (placeholder) */}
      <section className="kdWavePlaceholder" aria-label="Waveform placeholder" />

      <main className="kdMain">
        <DeckPanel deckIdx={1} side="left" meta={deck1Meta} />
        <MixerPanel />
        <DeckPanel deckIdx={2} side="right" meta={deck2Meta} />
      </main>

      {/* 하단 라이브러리 영역 (placeholder) */}
      <section className="kdLibraryPlaceholder" aria-label="Library placeholder">
        <div className="kdLibraryPlaceholder__side" />
        <div className="kdLibraryPlaceholder__main" />
      </section>
    </div>
  );
}

export default App;
