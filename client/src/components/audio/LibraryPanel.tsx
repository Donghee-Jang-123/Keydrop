import React, { useEffect, useMemo, useState } from 'react';
import { fetchMusicList } from '../../api/musicApi';
import { useDJStore } from '../../store/useDJStore';

const formatTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

interface LibraryPanelProps {
  fetchOnMount?: boolean;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ fetchOnMount = true }) => {
  const ALL_GENRE = 'All';
  const tracks = useDJStore((s) => s.libraryTracks);
  const selectedIndex = useDJStore((s) => s.librarySelectedIndex);

  const fxTargetDeck = useDJStore((s) => s.fxTargetDeck);
  const { setLibraryTracks, requestLoadMusicFromDb } = useDJStore((s) => s.actions);

  const [selectedGenre, setSelectedGenre] = useState<string>(ALL_GENRE);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!fetchOnMount) return;
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
  }, [fetchOnMount, setLibraryTracks]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      const g = (t.genre ?? '').trim();
      if (g) set.add(g);
    });
    return Array.from(set);
  }, [tracks]);

  // 트랙 목록이 바뀌었는데 선택된 장르가 사라졌으면 All로 되돌림
  useEffect(() => {
    if (selectedGenre === ALL_GENRE) return;
    if (genres.includes(selectedGenre)) return;
    setSelectedGenre(ALL_GENRE);
  }, [ALL_GENRE, genres, selectedGenre]);

  const visibleTracks = useMemo(() => {
    if (selectedGenre === ALL_GENRE) return tracks;
    const target = selectedGenre.trim();
    return tracks.filter((t) => (t.genre ?? '').trim() === target);
  }, [ALL_GENRE, selectedGenre, tracks]);

  const selectedTrackId = tracks[selectedIndex]?.musicId;

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
          
        </div>
      </aside>

      <div className="library__main">
        <div className="library__genres">
          <button
            type="button"
            className={`library__genre ${selectedGenre === ALL_GENRE ? 'library__genre--active' : ''}`}
            aria-pressed={selectedGenre === ALL_GENRE}
            onClick={() => setSelectedGenre(ALL_GENRE)}
          >
            {ALL_GENRE}
          </button>

          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className={`library__genre ${selectedGenre === g ? 'library__genre--active' : ''}`}
              aria-pressed={selectedGenre === g}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="library__tables">
          <div className="library__table">
            <div className="library__tableHeader">
              <div className="library__col library__col--play" />
              <div className="library__col library__col--title">Title</div>
              <div className="library__col library__col--artist">Artist</div>
              <div className="library__col library__col--bpm">BPM</div>
              <div className="library__col library__col--dur">Time</div>
            </div>

            {visibleTracks.map((t) => (
              <div
                key={t.musicId}
                className={`library__row ${t.musicId === selectedTrackId ? 'library__row--selected' : ''}`}
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
                  {t.title}
                </div>
                <div className="library__col library__col--artist">{t.artists}</div>
                <div className="library__col library__col--bpm">{t.bpm}</div>
                <div className="library__col library__col--dur">{formatTime(t.duration)}</div>
              </div>
            ))}

          </div>


        </div>
      </div>
    </section>
  );
};

export default LibraryPanel;