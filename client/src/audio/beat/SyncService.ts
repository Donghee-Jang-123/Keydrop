import type { BeatAnalysis } from "./type";
import { createBeatGrid } from "./BeatGrid";
import type { Deck } from "../deck/Deck";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export class SyncService {
  public syncSlaveToMaster(
    master: Deck,
    slave: Deck,
    masterAnalysis: BeatAnalysis,
    slaveAnalysis: BeatAnalysis
  ): void {
    const mState = master.getState();
    const sState = slave.getState();

    if (!master.getBuffer() || !slave.getBuffer()) return;

    const mGrid = createBeatGrid(masterAnalysis.bpm, masterAnalysis.anchorSec);
    const sGrid = createBeatGrid(slaveAnalysis.bpm, slaveAnalysis.anchorSec);

    const masterNextBeat = mGrid.getNextBeatSec(mState.positionSec);
    const slaveNextBeat = sGrid.getNextBeatSec(sState.positionSec);

    const delta = masterNextBeat - slaveNextBeat;

    const maxJumpSec = 0.35;
    const clampedDelta = clamp(delta, -maxJumpSec, maxJumpSec);

    slave.seek(sState.positionSec + clampedDelta);

    const rawRate = masterAnalysis.bpm / Math.max(1e-6, slaveAnalysis.bpm);

    const targetRate = clamp(rawRate, 0.98, 1.02);

    slave.rampPlaybackRate(targetRate, 1.2);
  }
}