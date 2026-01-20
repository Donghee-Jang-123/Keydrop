import React from 'react';
import { useDJStore } from '../../store/useDJStore';

interface KnobProps {
  deckIdx: 1 | 2;
  knobType: 'mid' | 'bass' | 'filter';
  label: string;
}

const Knob: React.FC<KnobProps> = ({ deckIdx, knobType, label }) => {
  // Selector를 사용해 '필요한 값만' 구독
  // 다른 노브가 움직일 때는 이 컴포넌트는 리렌더링 X
  const value = useDJStore((state) => 
    deckIdx === 1 ? state.deck1[knobType] : state.deck2[knobType]
  );

  // 0.0 ~ 1.0 값을 각도(-135도 ~ +135도)로 변환
  const rotation = value * 270 - 135;
  const sweep = value * 270;
  const isActive = useDJStore((s) => !!s.activeControls?.[`deck${deckIdx}:${knobType}`]);

  return (
    <div className="knob-container" style={{ textAlign: 'center' }}>
      <div className="knob-label">{label}</div>

      {/* 사진처럼: (1) 값만큼 채워지는 링 + (2) 고정 다이얼 + (3) 회전 포인터 */}
      <div className={`knob ${isActive ? 'knob--active' : ''}`}>
        <div
          className="knob-ring"
          style={
            {
              ['--sweep' as any]: `${sweep}deg`,
              ['--ringColor' as any]: deckIdx === 1 ? 'rgba(98, 255, 120, 0.95)' : 'rgba(104, 246, 255, 0.95)',
            } as React.CSSProperties
          }
          aria-hidden="true"
        />
        <div className="knob-dial">
          <div className="knob-pointer" style={{ transform: `rotate(${rotation}deg)` }}>
            <div className="knob-dot" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Knob;