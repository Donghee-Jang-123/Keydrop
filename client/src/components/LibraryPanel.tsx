import React from 'react';

const LibraryPanel: React.FC = () => {
  const genres = ['Dance', 'EDM', 'House', 'Techno', 'Trance', 'Dubstep', 'Drum’n’Bass', 'Hip-Hop', 'Trap', 'Latin'];
  const rows = [
    { title: 'Empire Of The Sun, DJ HEARTSTRING', bpm: 141, dur: '5:19' },
    { title: 'Chris Lake, Lady (Confidence Man)', bpm: 128, dur: '3:49' },
    { title: 'Delilah Montagu, Fred Again..', bpm: 132, dur: '4:20' },
    { title: 'Need Your Body (Exported Remix)', bpm: 128, dur: '3:57' },
    { title: 'LSDNS', bpm: 123, dur: '3:15' },
    { title: 'Tommy Trash', bpm: 128, dur: '4:12' },
  ];

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
            {rows.map((r) => (
              <div key={r.title} className="library__row">
                <div className="library__col library__col--play">▶</div>
                <div className="library__col library__col--title">{r.title}</div>
                <div className="library__col library__col--bpm">{r.bpm}</div>
                <div className="library__col library__col--dur">{r.dur}</div>
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
            {rows.map((r) => (
              <div key={`np-${r.title}`} className="library__row">
                <div className="library__col library__col--play">⏵</div>
                <div className="library__col library__col--title">{r.title}</div>
                <div className="library__col library__col--bpm">{r.bpm}</div>
                <div className="library__col library__col--dur">{r.dur}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LibraryPanel;

