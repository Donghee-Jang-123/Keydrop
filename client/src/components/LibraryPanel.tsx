import React, { useEffect, useMemo } from 'react';
import { fetchMusicList } from '../api/musicApi';
import { useDJStore } from '../store/useDJStore';

const formatTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

const LibraryPanel: React.FC = () => {
  const tracks = useDJStore((s) => s.libraryTracks);
  const selectedIndex = useDJStore((s) => s.librarySelectedIndex);

  const fxTargetDeck = useDJStore((s) => s.fxTargetDeck);
  const { setLibraryTracks, requestLoadMusicFromDb } = useDJStore((s) => s.actions);

  const deck1 = useDJStore((s) => s.deck1);
  const deck2 = useDJStore((s) => s.deck2);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchMusicList();
        if (!alive) return;
        setLibraryTracks(list);
      } catch (e: any) {
        if (!alive) return;
        setLibraryTracks([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      const g = (t.genre ?? '').trim();
      if (g) set.add(g);
    });
    return Array.from(set);
  }, [tracks]);

  return (
    <section className="library" aria-label="Library">
      <aside className="library__side">
        <div className="library__nav">
          <button className="library__navItem library__navItem--active" type="button">
            Library
          </button>
          <button className="library__navItem" type="button">
            Likes
          </button>
          <button className="library__navItem" type="button">
            Upload
          </button>
          <button className="library__navItem" type="button">
            Sampler
          </button>
        </div>
      </aside>

      <div className="library__main">
        <div className="library__genres">
          {genres.map((g) => (
            <div key={g} className="library__genre">
              {g}
            </div>
          ))}
        </div>

        <div className="library__tables">
          <div className="library__table">
            <div className="library__tableHeader">
              <div className="library__col library__col--play" />
              <div className="library__col library__col--title">Search for music...</div>
              <div className="library__col library__col--bpm">BPM</div>
              <div className="library__col library__col--dur">Time</div>
            </div>

          {tracks.map((t, idx) => (
            <div
              key={t.musicId}
              className={`library__row ${idx === selectedIndex ? 'library__row--selected' : ''}`}
            >
              <div className="library__col library__col--play">
                <button
                  type="button"
                  onClick={() => requestLoadMusicFromDb(fxTargetDeck, t)}
                  aria-label={`load ${t.title} to deck ${fxTargetDeck}`}
                >
                  ▶
                </button>
              </div>

              <div className="library__col library__col--title">
                {t.title} - {t.artists}
              </div>
              <div className="library__col library__col--bpm">{t.bpm}</div>
              <div className="library__col library__col--dur">{formatTime(t.duration)}</div>
            </div>
          ))}

          </div>

          <div className="library__table">
            <div className="library__tableHeader">
              <div className="library__col library__col--play" />
              <div className="library__col library__col--title">Now Playing</div>
              <div className="library__col library__col--bpm">BPM</div>
              <div className="library__col library__col--dur">Time</div>
            </div>

            <div className="library__row">
              <div className="library__col library__col--play">⏵</div>
              <div className="library__col library__col--title">
                Deck1: {deck1.trackTitle}
              </div>
              <div className="library__col library__col--bpm">{useDJStore.getState().deck1.trackBpm ?? '-'}</div>
              <div className="library__col library__col--dur">
                {deck1.durationSec ? formatTime(deck1.durationSec) : '-'}
              </div>
            </div>

            <div className="library__row">
              <div className="library__col library__col--play">⏵</div>
              <div className="library__col library__col--title">
                Deck2: {deck2.trackTitle}
              </div>
              <div className="library__col library__col--bpm">{useDJStore.getState().deck2.trackBpm ?? '-'}</div>
              <div className="library__col library__col--dur">
                {deck2.durationSec ? formatTime(deck2.durationSec) : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LibraryPanel;