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

  const pads =
    side === 'left'
      ? [
          { label: meta.time, variant: 'red' as const },
          { label: 'slicer', keyHint: deckIdx === 1 ? 'num4' : 'num4', variant: 'gray' as const },
          { label: 'crush', keyHint: deckIdx === 1 ? 'num1' : 'num1', variant: 'gray' as const },
          { label: 'cue 2', keyHint: deckIdx === 1 ? '2' : '9', variant: 'gray' as const },
          { label: 'kick', keyHint: deckIdx === 1 ? 'num5' : 'num5', variant: 'gray' as const },
          { label: 'flanger', keyHint: deckIdx === 1 ? 'num2' : 'num2', variant: 'gray' as const },
        ]
      : [
          { label: 'cue 1', keyHint: deckIdx === 1 ? '1' : '8', variant: 'gray' as const },
          { label: 'cue 2', keyHint: deckIdx === 1 ? '2' : '9', variant: 'gray' as const },
          { label: 'slicer', keyHint: 'num4', variant: 'gray' as const },
          { label: 'kick', keyHint: 'num5', variant: 'gray' as const },
          { label: 'crush', keyHint: 'num1', variant: 'gray' as const },
          { label: 'flanger', keyHint: 'num2', variant: 'gray' as const },
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

      <div className="deckPanel__body">
        {side === 'left' ? (
          <div className="deckPanel__pads">
            {pads.map((p) => (
              <EffectPad key={`${p.label}-${p.keyHint ?? ''}`} label={p.label} keyHint={p.keyHint} variant={p.variant} />
            ))}
          </div>
        ) : null}

        <div className="deckPanel__turntable">
          <Turntable isPlaying={deck.isplay} keyHint={deckIdx === 1 ? 'G' : 'H'} />
        </div>

        {side === 'right' ? (
          <div className="deckPanel__pads">
            {pads.map((p) => (
              <EffectPad key={`${p.label}-${p.keyHint ?? ''}`} label={p.label} keyHint={p.keyHint} variant={p.variant} />
            ))}
          </div>
        ) : null}
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

