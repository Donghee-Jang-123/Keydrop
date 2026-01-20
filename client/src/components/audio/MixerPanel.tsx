import React from 'react';
import { useDJStore } from '../../store/useDJStore';
import Knob from './Knob';

type MixerPanelProps = {
  masterBpm: number;
};

const MixerPanel: React.FC<MixerPanelProps> = ({ masterBpm }) => {
  const crossFader = useDJStore((s) => s.crossFader);
  const deck1 = useDJStore((s) => s.deck1);
  const deck2 = useDJStore((s) => s.deck2);
  const faderActive1 = useDJStore((s) => !!s.activeControls?.['deck1:fader']);
  const faderActive2 = useDJStore((s) => !!s.activeControls?.['deck2:fader']);
  const crossActive = useDJStore((s) => !!s.activeControls?.['cross']);

  const VFADER_HEIGHT = 240;
  const VFADER_PAD = 15; 
  const VFADER_USABLE = VFADER_HEIGHT - VFADER_PAD * 2; 

  // fader: 0~1 (상단이 1), 패딩(15px)을 고려한 계산
  const faderTop1 = `calc(${VFADER_PAD}px + ${(1 - deck1.fader) * VFADER_USABLE}px + 35px)`;
  const faderTop2 = `calc(${VFADER_PAD}px + ${(1 - deck2.fader) * VFADER_USABLE}px + 35px)`;
  const faderFillH1 = `${deck1.fader * VFADER_USABLE}px`;
  const faderFillH2 = `${deck2.fader * VFADER_USABLE}px`;

  return (
    <section className="mixerPanel" aria-label="Mixer">
      <div className="mixerPanel__bpm">
        <span className="mixerPanel__bpmBig">{Math.round(masterBpm)}</span>
        
        <span className="mixerPanel__bpmUnit">BPM</span>

      </div>

      <div className="mixerPanel__knobCols">
        <div className="mixerPanel__knobCol">
          <Knob deckIdx={1} knobType="mid" label="MID" />
          <Knob deckIdx={1} knobType="bass" label="BASS" />
          <Knob deckIdx={1} knobType="filter" label="Filter" />
        </div>

        <div className="mixerPanel__faders">
          <div className="mixerPanel__vfader">
            <div className={`mixerPanel__vfaderTrack ${faderActive1 ? 'mixerPanel__vfaderTrack--active' : ''}`}>
              <div className="mixerPanel__vfaderMeter" aria-hidden="true" />
              <div
                className="mixerPanel__vfaderFill mixerPanel__vfaderFill--left"
                style={{ height: faderFillH1 }}
                aria-hidden="true"
              />
              <div className="mixerPanel__vfaderThumb mixerPanel__vfaderThumb--left" style={{ top: faderTop1 }} />
            </div>
          </div>
          <div className="mixerPanel__vfader">
            <div className={`mixerPanel__vfaderTrack ${faderActive2 ? 'mixerPanel__vfaderTrack--active' : ''}`}>
              <div className="mixerPanel__vfaderMeter" aria-hidden="true" />
              <div
                className="mixerPanel__vfaderFill mixerPanel__vfaderFill--right"
                style={{ height: faderFillH2 }}
                aria-hidden="true"
              />
              <div className="mixerPanel__vfaderThumb mixerPanel__vfaderThumb--right" style={{ top: faderTop2 }} />
            </div>
          </div>
        </div>

        <div className="mixerPanel__knobCol">
          <Knob deckIdx={2} knobType="mid" label="MID" />
          <Knob deckIdx={2} knobType="bass" label="BASS" />
          <Knob deckIdx={2} knobType="filter" label="Filter" />
        </div>
      </div>

      <div className="mixerPanel__cross">
        <div className={`mixerPanel__crossTrack ${crossActive ? 'mixerPanel__crossTrack--active' : ''}`}>
          <div className="mixerPanel__crossGradient" aria-hidden="true" />
          <div className="mixerPanel__crossThumb" style={{ left: `${((crossFader + 1) / 2) * 100}%` }} />
        </div>
      </div>
    </section>
  );
};

export default MixerPanel;

