import React from 'react';

interface EffectPadProps {
  label: string;
  keyHint?: string;
  active?: boolean;
  variant?: 'red' | 'purple' | 'blue' | 'gray';
  className?: string;
}

const EffectPad: React.FC<EffectPadProps> = ({ label, keyHint, active, variant = 'gray', className = '' }) => {
  return (
    <button
      type="button"
      className={`pad pad--${variant} ${active ? 'pad--active' : ''} ${className}`}
      aria-pressed={active ? 'true' : 'false'}
    >
      <div className="pad__label">{label}</div>
      {keyHint ? <div className="pad__key">{keyHint}</div> : null}
    </button>
  );
};

export default EffectPad;

