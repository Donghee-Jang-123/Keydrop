import React from 'react';
import { useDJStore } from '../../store/useDJStore';
import type { FxType } from '../../store/useDJStore';
import { resolveMusicUrl } from '../../api/musicApi';
import Knob from './Knob';
import Turntable from './Turntable';
import EffectPad from './EffectPad';
import WaveformBar from './WaveformBar';

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
  const cue1Active = useDJStore((s) => !!s.activeControls?.[`deck${deckIdx}:cue1`]);
  const cue2Active = useDJStore((s) => !!s.activeControls?.[`deck${deckIdx}:cue2`]);
  
  // 요청사항: Deck1/Deck2 모두 3x2 버튼(6개)로 통일
  const cue1Key = deckIdx === 1 ? '1' : '9';
  const cue2Key = deckIdx === 1 ? '2' : '0';

  const pads: Array<{ label: string; keyHint: string; variant: 'gray' | 'red'; fx?: FxType; cueIndex?: 1 | 2 }> = [
    { label: 'cue 1', keyHint: cue1Key, variant: 'gray', cueIndex: 1 },
    { label: 'cue 2', keyHint: cue2Key, variant: 'gray', cueIndex: 2 },
    { label: 'slicer', keyHint: 'num4', variant: 'gray', fx: 'SLICER' },
    { label: 'kick', keyHint: 'num5', variant: 'gray', fx: 'KICK' },
    { label: 'crush', keyHint: 'num1', variant: 'gray', fx: 'CRUSH' },
    { label: 'flanger', keyHint: 'num2', variant: 'gray', fx: 'FLANGER' },
  ];

  return (
    <section className={`deckPanel deckPanel--${side}`}>
      <header className="deckPanel__header">
        <div className="deckPanel__album" aria-label="Album cover">
          {deck.coverUrl ? (
            <img
              src={resolveMusicUrl(deck.coverUrl)}
              alt=""
              className="deckPanel__albumImg"
              draggable={false}
            />
          ) : (
            <div className="deckPanel__albumPlaceholder" />
          )}
        </div>
        <div className="deckPanel__meta">
          <div className="deckPanel__titleRow">
            <div className="deckPanel__title">{deck.trackTitle || meta.title}</div>
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


      <div className={`deckPanel__subHeader ${deck.isPlaying ? 'deckPanel__subHeader--playing' : ''}`}>
        <div className="deckPanel__time">{meta.time}</div>
        /<div className="deckPanel__duration">{meta.duration}</div>
      </div>

      {/* 덱 내부 파형 (placeholder) */}
      <div className="deckPanel__wavePlaceholder">
        <WaveformBar deckIdx={deckIdx} variant="deck" />
      </div>

      <div className="deckPanel__body">
        {/* Deck1(왼쪽 덱)은 "패드(왼쪽) - 턴테이블(오른쪽)" 배치 */}
        {side === 'left' ? (
          <>
            <div className="deckPanel__pads deckPanel__pads--grid">
              {pads.map((p) => (
                <EffectPad
                  key={`${p.label}-${p.keyHint}`}
                  label={p.label}
                  keyHint={p.keyHint}
                  variant={p.variant}
                  active={p.fx ? deck.fx === p.fx : p.cueIndex === 1 ? cue1Active : p.cueIndex === 2 ? cue2Active : false}
                  className={p.label.includes('cue') ? 'pad--cue' : ''}
                />
              ))}
            </div>
            <div className="deckPanel__turntable">
              <Turntable
                deckIdx={deckIdx}
                isplay={deck.isPlaying}
                playKeyHint={deckIdx === 1 ? 'G' : 'H'}
                keyHint={deckIdx === 1 ? 'V' : 'N'}
              />
            </div>
          </>
        ) : (
          /* Deck2(오른쪽 덱)은 "턴테이블(왼쪽) - 패드(오른쪽)" 배치 */
          <>
            <div className="deckPanel__turntable">
              <Turntable
                deckIdx={deckIdx}
                isplay={deck.isPlaying}
                playKeyHint={deckIdx === 1 ? 'G' : 'H'}
                keyHint={deckIdx === 1 ? 'V' : 'N'}
              />
            </div>
            <div className="deckPanel__pads deckPanel__pads--grid">
              {pads.map((p) => (
                <EffectPad
                  key={`${p.label}-${p.keyHint}`}
                  label={p.label}
                  keyHint={p.keyHint}
                  variant={p.variant}
                  active={p.fx ? deck.fx === p.fx : p.cueIndex === 1 ? cue1Active : p.cueIndex === 2 ? cue2Active : false}
                  className={p.label.includes('cue') ? 'pad--cue' : ''}
                />
              ))}
            </div>
          </>
        )}
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

