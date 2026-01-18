import React from 'react';
import { useDJStore } from '../store/useDJStore';
import Knob from './Knob';
import Turntable from './Turntable';
import EffectPad from './EffectPad';

interface DeckMeta {
  title: string;
  artist: string;
  bpm: number;
  time: string;
  duration: string;
}

interface DeckPanelProps {
  deckIdx: 1 | 2;
  side: 'left' | 'right';
  meta: DeckMeta;
}

const DeckPanel: React.FC<DeckPanelProps> = ({ deckIdx, side, meta }) => {
  const deck = useDJStore((s) => (deckIdx === 1 ? s.deck1 : s.deck2));

  // - 왼쪽 덱: 좌/우에 세로 3개 패드, 가운데 턴테이블
  // - 오른쪽 덱: 왼쪽에 미니 파형(placeholder) 세로막대 느낌, 오른쪽에 2x3 패드
  const leftPads =
    side === 'left'
      ? [
          { label: meta.time, variant: 'red' as const },
          { label: 'slicer', keyHint: 'num4', variant: 'gray' as const, fx: 'SLICER' as const },
          { label: 'crush', keyHint: 'num1', variant: 'gray' as const, fx: 'CRUSH' as const },
        ]
      : [];

  const rightPads =
    side === 'left'
      ? [
          { label: 'cue 2', keyHint: deckIdx === 1 ? '2' : '9', variant: 'gray' as const },
          { label: 'kick', keyHint: 'num5', variant: 'gray' as const, fx: 'KICK' as const },
          { label: 'flanger', keyHint: 'num2', variant: 'gray' as const, fx: 'FLANGER' as const },
        ]
      : [
          { label: 'cue 1', keyHint: '8', variant: 'gray' as const },
          { label: 'cue 2', keyHint: '9', variant: 'gray' as const },
          { label: 'slicer', keyHint: 'num4', variant: 'gray' as const, fx: 'SLICER' as const },
          { label: 'kick', keyHint: 'num5', variant: 'gray' as const, fx: 'KICK' as const },
          { label: 'crush', keyHint: 'num1', variant: 'gray' as const, fx: 'CRUSH' as const },
          { label: 'flanger', keyHint: 'num2', variant: 'gray' as const, fx: 'FLANGER' as const },
        ];

  return (
    <section className={`deckPanel deckPanel--${side}`}>
      <header className="deckPanel__header">
        <div className="deckPanel__album" aria-hidden="true" />
        <div className="deckPanel__meta">
          <div className="deckPanel__titleRow">
            <div className="deckPanel__title">{meta.title}</div>
            <div className="deckPanel__like" aria-hidden="true">
              ♥
            </div>
          </div>
          <div className="deckPanel__artist">{meta.artist}</div>
        </div>
        <div className="deckPanel__bpm">
          <div className="deckPanel__bpmLabel">BPM</div>
          <div className="deckPanel__bpmValue">{meta.bpm}</div>
        </div>
      </header>

      <div className="deckPanel__subHeader">
        <div className="deckPanel__time">{meta.time}</div>
        <div className="deckPanel__duration">{meta.duration}</div>
      </div>

      {/* 덱 내부 파형 (placeholder) */}
      <div className="deckPanel__wavePlaceholder" aria-hidden="true" />

      <div className="deckPanel__body">
        <div className="deckPanel__col deckPanel__col--left" aria-hidden={side === 'right' ? 'true' : 'false'}>
          {side === 'right' ? <div className="deckPanel__meterPlaceholder" aria-hidden="true" /> : null}
          {side === 'left' ? (
            <div className="deckPanel__pads deckPanel__pads--col">
              {leftPads.map((p) => (
                <EffectPad
                  key={`${p.label}-${p.keyHint ?? ''}`}
                  label={p.label}
                  keyHint={p.keyHint}
                  variant={p.variant}
                  active={p.fx ? deck.fx === p.fx : false}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="deckPanel__turntable">
          <Turntable isPlaying={deck.isplay} keyHint={deckIdx === 1 ? 'G' : 'H'} />
        </div>

        <div className="deckPanel__col deckPanel__col--right">
          <div className={`deckPanel__pads ${side === 'left' ? 'deckPanel__pads--col' : 'deckPanel__pads--grid'}`}>
            {rightPads.map((p) => (
              <EffectPad
                key={`${p.label}-${p.keyHint ?? ''}`}
                label={p.label}
                keyHint={p.keyHint}
                variant={p.variant}
                active={p.fx ? deck.fx === p.fx : false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 노브는 스크린샷처럼 믹서 주변에 두는 게 자연스럽지만, 현재는 덱에도 최소 표시 */}
      <div className="deckPanel__knobs">
        <Knob deckIdx={deckIdx} knobType="mid" label="MID" />
        <Knob deckIdx={deckIdx} knobType="bass" label="BASS" />
        <Knob deckIdx={deckIdx} knobType="filter" label="Filter" />
      </div>
    </section>
  );
};

export default DeckPanel;

