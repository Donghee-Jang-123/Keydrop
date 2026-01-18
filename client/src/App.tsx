import './App.css';
import { useInputManager } from './hooks/useInputmanager';
import { audioEngine } from './services/audioEngine';
import DeckPanel from './components/DeckPanel';
import MixerPanel from './components/MixerPanel';

function App() {
  // 키보드 입력 관리 훅 연결
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
          <div className="kdLogo">
            Key<span className="kdLogo__accent">DROP</span>
          </div>
          <div className="kdTop__tagline">Turn your keyboard into a stage</div>
        </div>
        <div className="kdTop__right">
          <button type="button" className="kdTop__liveBtn">
            LIVE
          </button>
          <button type="button" className="kdTop__recBtn" aria-label="Record" />
          <div className="kdTop__user" aria-hidden="true">
            ⦿
          </div>
        </div>
      </header>

      <main className="kdMain">
        <DeckPanel deckIdx={1} side="left" meta={deck1Meta} />
        <MixerPanel />
        <DeckPanel deckIdx={2} side="right" meta={deck2Meta} />
      </main>
    </div>
  );
}

export default App;
