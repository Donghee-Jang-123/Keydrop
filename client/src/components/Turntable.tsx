import React from 'react';

interface TurntableProps {
  isPlaying: boolean;
  keyHint: string;
}

const Turntable: React.FC<TurntableProps> = ({ isPlaying, keyHint }) => {
  return (
    <div className={`turntable ${isPlaying ? 'turntable--playing' : ''}`} aria-label="Turntable">
      <div className="turntable__ring" />
      <div className="turntable__disc" />
      <div className="turntable__center" />
      <div className="turntable__btn" aria-hidden="true">
        <div className="turntable__btnIcon">{isPlaying ? '⏸' : '▶'}</div>
        <div className="turntable__btnKey">{keyHint}</div>
      </div>
    </div>
  );
};

export default Turntable;

