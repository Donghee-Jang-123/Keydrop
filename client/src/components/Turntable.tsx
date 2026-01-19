import React from 'react';

interface TurntableProps {
  isplay: boolean;
  keyHint: string;
}

const Turntable: React.FC<TurntableProps> = ({ isplay, keyHint }) => {
  return (
    <div className={`turntable ${isplay ? 'turntable--playing' : ''}`} aria-label="Turntable">
      <div className="turntable__ring" />
      <div className="turntable__disc" />
      <div className="turntable__center" />
      <div className="turntable__btn" aria-hidden="true">
        <div className="turntable__btnIcon">{isplay ? '⏸' : '▶'}</div>
        <div className="turntable__btnKey">{keyHint}</div>
      </div>
    </div>
  );
};

export default Turntable;

