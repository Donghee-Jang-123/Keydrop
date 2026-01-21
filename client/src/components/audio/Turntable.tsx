import React from 'react';

interface TurntableProps {
  isplay: boolean;
  keyHint: string;
  playKeyHint?: string;
  deckIdx?: 1 | 2;
}

const Turntable: React.FC<TurntableProps> = ({ isplay, keyHint, playKeyHint, deckIdx }) => {
  return (
    <div
      className={`turntable ${deckIdx === 1 ? 'turntable--deck1' : ''} ${isplay ? 'turntable--playing' : ''}`}
      aria-label="Turntable"
    >
      <div className="turntable__ring" />
      <div className="turntable__disc" />
      <div className="turntable__center" />
      <div className="turntable__btn" aria-hidden="true">
        <div className="turntable__btnIcon">{isplay ? '\u23F8\uFE0E' : '\u25B6\uFE0E'}</div>
        {playKeyHint ? <div className="turntable__btnKeyAbove">{playKeyHint}</div> : null}
        <div className="turntable__btnKey">{keyHint}</div>
      </div>
    </div>
  );
};

export default Turntable;

