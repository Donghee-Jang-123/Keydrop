import React from 'react';
import { useDJStore } from '../store/useDJStore';

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

  return (
    <div className="knob-container" style={{ textAlign: 'center' }}>
      <div className="knob-label">{label}</div>
      {/* 실제 돌아가는 다이얼 이미지 또는 CSS */}
      <div 
        className="knob-dial"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '3px solid #555',
          position: 'relative',
          // CSS transform으로 회전 적용
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.05s linear' // 부드러운 움직임 (옵션)
        }}
      >
        {/* 노브의 현재 위치를 가리키는 점 */}
        <div style={{
          position: 'absolute',
          top: '5px',
          left: '50%',
          width: '6px',
          height: '6px',
          backgroundColor: 'cyan',
          borderRadius: '50%',
          transform: 'translateX(-50%)'
        }} />
      </div>
    </div>
  );
};

export default Knob;