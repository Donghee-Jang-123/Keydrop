import React from 'react';
import { useDJStore } from '../store/useDJStore';
import Knob from './Knob';

const MixerPanel: React.FC = () => {
  const bpm = useDJStore((s) => s.bpm);
  const crossFader = useDJStore((s) => s.crossFader);
  const deck1 = useDJStore((s) => s.deck1);
  const deck2 = useDJStore((s) => s.deck2);

  // fader: 0~1 (상단이 1)
  const faderTop1 = `${(1 - deck1.fader) * 100}%`;
  const faderTop2 = `${(1 - deck2.fader) * 100}%`;

  return (
    <section className="mixerPanel" aria-label="Mixer">
      <div className="mixerPanel__bpm">
        <div className="mixerPanel__bpmSmall">BPM</div>
        <div className="mixerPanel__bpmBig">{Math.round(bpm)}</div>
        <div className="mixerPanel__bpmUnit">BPM</div>
        <button type="button" className="mixerPanel__matchBtn">
          Match
        </button>
      </div>

      <div className="mixerPanel__knobCols">
        <div className="mixerPanel__knobCol">
          <Knob deckIdx={1} knobType="mid" label="MID" />
          <Knob deckIdx={1} knobType="bass" label="BASS" />
          <Knob deckIdx={1} knobType="filter" label="Filter" />
        </div>

        <div className="mixerPanel__faders">
          <div className="mixerPanel__vfader">
            <div className="mixerPanel__vfaderTrack">
              <div className="mixerPanel__vfaderThumb mixerPanel__vfaderThumb--left" style={{ top: faderTop1 }} />
            </div>
          </div>
          <div className="mixerPanel__vfader">
            <div className="mixerPanel__vfaderTrack">
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
        <div className="mixerPanel__crossTrack">
          <div className="mixerPanel__crossThumb" style={{ left: `${((crossFader + 1) / 2) * 100}%` }} />
        </div>
      </div>
    </section>
  );
};

export default MixerPanel;

