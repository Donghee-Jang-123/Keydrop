import React from 'react';

interface WaveformBarProps {
  variant?: 'top' | 'deck';
}

const WaveformBar: React.FC<WaveformBarProps> = ({ variant = 'top' }) => {
  return (
    <div className={`wave wave--${variant}`} aria-hidden="true">
      <div className="wave__row wave__row--a" />
      <div className="wave__row wave__row--b" />
      <div className="wave__playhead" />
    </div>
  );
};

export default WaveformBar;

