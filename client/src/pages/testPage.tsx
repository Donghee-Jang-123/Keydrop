import React, { useMemo, useRef, useState } from "react";
import { AudioEngine } from "../audio/core/AudioEngine";
import { AudioBus } from "../audio/core/AudioBus";
import { TrackLoader } from "../audio/track/TrackLoader";
import { Deck } from "../audio/deck/Deck";
import { Mixer } from "../audio/mixer/Mixer";
import { FXRack, type FXType } from "../audio/fx/FXRack";
import { BeatAnalyzer } from "../audio/beat/BeatAnalyzer";
import { SyncService } from "../audio/beat/SyncService";
import type { BeatAnalysis } from "../audio/beat/type";
import type { Music } from "../types/music";
import { fetchMusicList, resolveMusicUrl } from "../api/musicApi";


type DeckNo = 1 | 2;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export default function TestPage() {
  const engine = useMemo(() => AudioEngine.instance, []);
  const [ctxState, setCtxState] = useState<AudioContextState>(engine.state);

  const busRef = useRef<AudioBus | null>(null);
  const loaderRef = useRef<TrackLoader>(new TrackLoader());

  const deck1Ref = useRef<Deck | null>(null);
  const deck2Ref = useRef<Deck | null>(null);
  const mixerRef = useRef<Mixer | null>(null);

  const fx1Ref = useRef<FXRack | null>(null);
  const fx2Ref = useRef<FXRack | null>(null);

  const analyzerRef = useRef(new BeatAnalyzer());
  const syncRef = useRef(new SyncService());

  const [d1Beat, setD1Beat] = useState<BeatAnalysis | null>(null);
  const [d2Beat, setD2Beat] = useState<BeatAnalysis | null>(null);

  const [tracks, setTracks] = useState<Music[]>([]);
  const [selected1, setSelected1] = useState<Music | null>(null);
  const [selected2, setSelected2] = useState<Music | null>(null);

  const [cross, setCross] = useState(0);

  const [d1Fader, setD1Fader] = useState(0.9);
  const [d1Bass, setD1Bass] = useState(0);
  const [d1Mid, setD1Mid] = useState(0);
  const [d1Filter, setD1Filter] = useState(1);
  const [d1Seek, setD1Seek] = useState(0);

  const [d2Fader, setD2Fader] = useState(0.9);
  const [d2Bass, setD2Bass] = useState(0);
  const [d2Mid, setD2Mid] = useState(0);
  const [d2Filter, setD2Filter] = useState(1);
  const [d2Seek, setD2Seek] = useState(0);

  const [d1Pos, setD1Pos] = useState(0);
  const [d2Pos, setD2Pos] = useState(0);
  const [d1Dur, setD1Dur] = useState(0);
  const [d2Dur, setD2Dur] = useState(0);
  const pollTimerRef = useRef<number | null>(null);

  const [d1Crush, setD1Crush] = useState(false);
  const [d1Flanger, setD1Flanger] = useState(false);
  const [d1Slicer, setD1Slicer] = useState(false);
  const [d1Kick, setD1Kick] = useState(false);

  const [d2Crush, setD2Crush] = useState(false);
  const [d2Flanger, setD2Flanger] = useState(false);
  const [d2Slicer, setD2Slicer] = useState(false);
  const [d2Kick, setD2Kick] = useState(false);

  const ensureAudioGraph = async (): Promise<void> => {
    await engine.resume();
    setCtxState(engine.state);

    if (!busRef.current) busRef.current = new AudioBus(engine.ctx);
    if (!deck1Ref.current) deck1Ref.current = new Deck(engine.ctx, 1);
    if (!deck2Ref.current) deck2Ref.current = new Deck(engine.ctx, 2);

    if (!mixerRef.current) {
    const mixer = new Mixer(engine.ctx);

    if (!fx1Ref.current) { fx1Ref.current = new FXRack(engine.ctx); }
    if (!fx2Ref.current) { fx2Ref.current = new FXRack(engine.ctx); }

    deck1Ref.current.output.connect(fx1Ref.current.input);
    deck2Ref.current.output.connect(fx2Ref.current.input);

    mixer.connectDeck1(fx1Ref.current.output);
    mixer.connectDeck2(fx2Ref.current.output);

    mixer.connectTo(busRef.current.masterGain);

    mixerRef.current = mixer;
  }


    startPolling();
  };

  const startPolling = (): void => {
    if (pollTimerRef.current !== null) return;

    pollTimerRef.current = window.setInterval(() => {
      const d1 = deck1Ref.current;
      const d2 = deck2Ref.current;
      if (d1) {
        const s = d1.getState();
        setD1Pos(s.positionSec);
        setD1Dur(s.durationSec);
        setD1Seek((prev) => (Math.abs(prev - s.positionSec) < 0.5 ? prev : s.positionSec));
      }
      if (d2) {
        const s = d2.getState();
        setD2Pos(s.positionSec);
        setD2Dur(s.durationSec);
        setD2Seek((prev) => (Math.abs(prev - s.positionSec) < 0.5 ? prev : s.positionSec));
      }
    }, 100);
  };

  const stopPolling = (): void => {
    if (pollTimerRef.current === null) return;
    window.clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
  };

  const analyzeDeck = async (deckNo: DeckNo) => {
    await ensureAudioGraph();
    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    const buf = deck?.getBuffer();
    if (!buf) return;

    const res = analyzerRef.current.analyze(buf);
    if (deckNo === 1) setD1Beat(res);
    else setD2Beat(res);
  };

  const beatMatch = async () => {
    await ensureAudioGraph();
    if (!d1Beat || !d2Beat) return;
    syncRef.current.syncSlaveToMaster(deck1Ref.current!, deck2Ref.current!, d1Beat, d2Beat);
  };

  const loadDeck = async (deckNo: DeckNo): Promise<void> => {
    await ensureAudioGraph();

    const track = deckNo === 1 ? selected1 : selected2;
    if (!track) return;

    const url = resolveMusicUrl(track.url);
    const buffer = await loaderRef.current.loadFromUrl(url, engine.ctx);

    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    deck.load(buffer);

    if (deckNo === 1) {
      setD1Dur(buffer.duration);
      setD1Seek(0);
    } else {
      setD2Dur(buffer.duration);
      setD2Seek(0);
    }
  };

  const toggleDeck = async (deckNo: DeckNo): Promise<void> => {
    await ensureAudioGraph();
    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    deck.toggle();
  };

  const stopDeckHard = async (deckNo: DeckNo): Promise<void> => {
    await ensureAudioGraph();
    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    deck.stop(true);
    if (deckNo === 1) setD1Seek(0);
    else setD2Seek(0);
  };

  const setCrossfader = async (v: number): Promise<void> => {
    await ensureAudioGraph();
    setCross(v);
    mixerRef.current!.setCrossfader(v);
  };

  const applyFx = (deckNo: DeckNo, type: FXType, enabled: boolean): void => {
    const fx = deckNo === 1 ? fx1Ref.current : fx2Ref.current;
    if (!fx) return;
    fx.setEnabled(type, enabled);
  };

  React.useEffect(() => applyFx(1, "crush", d1Crush), [d1Crush]);
  React.useEffect(() => applyFx(1, "flanger", d1Flanger), [d1Flanger]);
  React.useEffect(() => applyFx(1, "slicer", d1Slicer), [d1Slicer]);
  React.useEffect(() => applyFx(1, "kick", d1Kick), [d1Kick]);

  React.useEffect(() => applyFx(2, "crush", d2Crush), [d2Crush]);
  React.useEffect(() => applyFx(2, "flanger", d2Flanger), [d2Flanger]);
  React.useEffect(() => applyFx(2, "slicer", d2Slicer), [d2Slicer]);
  React.useEffect(() => applyFx(2, "kick", d2Kick), [d2Kick]);

  React.useEffect(() => {
    return () => stopPolling();
  }, []);

  React.useEffect(() => {
    fetchMusicList().then(setTracks).catch(console.error);
  }, []);

  React.useEffect(() => {
    const d = deck1Ref.current;
    if (!d) return;
    d.setFader(d1Fader);
    d.setBassGainDb(d1Bass);
    d.setMidGainDb(d1Mid);
    d.setFilterValue(d1Filter);
  }, [d1Fader, d1Bass, d1Mid, d1Filter]);

  React.useEffect(() => {
    const d = deck2Ref.current;
    if (!d) return;
    d.setFader(d2Fader);
    d.setBassGainDb(d2Bass);
    d.setMidGainDb(d2Mid);
    d.setFilterValue(d2Filter);
  }, [d2Fader, d2Bass, d2Mid, d2Filter]);

  const seekDeck = async (deckNo: DeckNo, sec: number): Promise<void> => {
    await ensureAudioGraph();
    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    deck.seek(sec);
  };

  const setCue = async (deckNo: DeckNo, idx: 1 | 2): Promise<void> => {
    await ensureAudioGraph();
    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    deck.setCue(idx);
  };

  const jumpCue = async (deckNo: DeckNo, idx: 1 | 2): Promise<void> => {
    await ensureAudioGraph();
    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    deck.jumpCue(idx);
  };

  const scratchDeck = async (deckNo: DeckNo): Promise<void> => {
    await ensureAudioGraph();
    const deck = deckNo === 1 ? deck1Ref.current! : deck2Ref.current!;
    deck.scratchBurst({ bursts: 4, grainMs: 55, jumpMs: 40, intensity: 1.0 });
  };

  const formatTime = (sec: number): string => {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const deckPanel = (deckNo: DeckNo) => {
    const isD1 = deckNo === 1;

    const fader = isD1 ? d1Fader : d2Fader;
    const bass = isD1 ? d1Bass : d2Bass;
    const mid = isD1 ? d1Mid : d2Mid;
    const filter = isD1 ? d1Filter : d2Filter;
    const seek = isD1 ? d1Seek : d2Seek;
    const pos = isD1 ? d1Pos : d2Pos;
    const dur = isD1 ? d1Dur : d2Dur;

    const setFader = isD1 ? setD1Fader : setD2Fader;
    const setBass = isD1 ? setD1Bass : setD2Bass;
    const setMid = isD1 ? setD1Mid : setD2Mid;
    const setFilter = isD1 ? setD1Filter : setD2Filter;
    const setSeek = isD1 ? setD1Seek : setD2Seek;

    return (
      <div style={{ width: 420 }}>
        <h3>Deck{deckNo}</h3>

        <div>tracks: {tracks.length}</div>
        <select
          value={(isD1 ? selected1?.musicId : selected2?.musicId) ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            const t = tracks.find((x) => x.musicId === id) ?? null;
            if (isD1) setSelected1(t);
            else setSelected2(t);
          }}
        >
          <option value="">(select track)</option>
          {tracks.map((t) => (
            <option key={t.musicId} value={t.musicId}>
              {t.title} - {t.artists} ({t.bpm} BPM)
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => loadDeck(deckNo)}>Load</button>
          <button onClick={() => toggleDeck(deckNo)}>Play/Stop</button>
          <button onClick={() => stopDeckHard(deckNo)}>Stop(Reset)</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div>
            <b>{formatTime(pos)}</b> / {formatTime(dur)}
          </div>
          <label>Seek</label>
          <input
            type="range"
            min={0}
            max={Math.max(0, dur)}
            step={0.01}
            value={clamp(seek, 0, Math.max(0, dur))}
            onChange={(e) => setSeek(Number(e.target.value))}
            onMouseUp={() => seekDeck(deckNo, seek)}
            onTouchEnd={() => seekDeck(deckNo, seek)}
            style={{ width: "100%" }}
            disabled={dur <= 0}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button disabled={dur <= 0} onClick={() => seekDeck(deckNo, 0)}>0s</button>
            <button disabled={dur <= 0} onClick={() => seekDeck(deckNo, 10)}>10s</button>
            <button disabled={dur <= 0} onClick={() => seekDeck(deckNo, 30)}>30s</button>
            <button disabled={dur <= 0} onClick={() => seekDeck(deckNo, 60)}>60s</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button onClick={() => setCue(deckNo, 1)}>Set Cue1</button>
          <button onClick={() => jumpCue(deckNo, 1)}>Jump Cue1</button>
          <button onClick={() => setCue(deckNo, 2)}>Set Cue2</button>
          <button onClick={() => jumpCue(deckNo, 2)}>Jump Cue2</button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>FX</div>

          {isD1 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setD1Crush((v) => !v)}>crush</button>
              <button onClick={() => setD1Flanger((v) => !v)}>flanger</button>
              <button onClick={() => setD1Slicer((v) => !v)}>slicer</button>
              <button onClick={() => setD1Kick((v) => !v)}>kick</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setD2Crush((v) => !v)}>crush</button>
              <button onClick={() => setD2Flanger((v) => !v)}>flanger</button>
              <button onClick={() => setD2Slicer((v) => !v)}>slicer</button>
              <button onClick={() => setD2Kick((v) => !v)}>kick</button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Scratch</div>
          <button onClick={() => scratchDeck(deckNo)}>Scratch Burst</button>
        </div>

        <div>
          <label>Fader {fader.toFixed(2)}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={fader}
            onChange={(e) => setFader(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <br />

          <label>Bass(dB) {bass.toFixed(1)}</label>
          <input
            type="range"
            min={-12}
            max={12}
            step={0.5}
            value={bass}
            onChange={(e) => setBass(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <br />

          <label>Mid(dB) {mid.toFixed(1)}</label>
          <input
            type="range"
            min={-12}
            max={12}
            step={0.5}
            value={mid}
            onChange={(e) => setMid(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <br />

          <label>Filter {filter.toFixed(2)}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={filter}
            onChange={(e) => setFilter(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </div>      
    );    
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>2Deck DJ System</h2>
      <p>
        AudioContext state: <b>{ctxState}</b>
      </p>

      <div style={{ marginBottom: 16 }}>
        <label>Crossfader: {cross.toFixed(2)}</label>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.01}
          value={cross}
          onChange={(e) => setCrossfader(Number(e.target.value))}
          style={{ width: 500, display: "block" }}
        />
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 40, alignItems: "flex-start" }}>
        {deckPanel(1)}
        {deckPanel(2)}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => analyzeDeck(1)}>Analyze BPM D1</button>
        <button onClick={() => analyzeDeck(2)}>Analyze BPM D2</button>
        <button onClick={beatMatch}>BeatMatch (D2 → D1)</button>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div>Deck1 BPM: <b>{d1Beat ? `${d1Beat.bpm} (conf ${d1Beat.confidence.toFixed(2)})` : "-"}</b></div>
        <div>Deck2 BPM: <b>{d2Beat ? `${d2Beat.bpm} (conf ${d2Beat.confidence.toFixed(2)})` : "-"}</b></div>
      </div>
    </div>
  );
}