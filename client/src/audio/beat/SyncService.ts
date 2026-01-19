import type { BeatAnalysis } from "./type";
import { createBeatGrid } from "./BeatGrid";
import type { Deck } from "../deck/Deck";

export class SyncService {
  /**
   * playbackRate 없이 "그럴듯한 beatmatching" (seek로 박 정렬)
   * - master의 "현재 박"에 slave를 맞춘다.
   */
  public syncSlaveToMaster(master: Deck, slave: Deck, masterAnalysis: BeatAnalysis, slaveAnalysis: BeatAnalysis): void {
    const mState = master.getState();
    const sState = slave.getState();

    const mGrid = createBeatGrid(masterAnalysis.bpm, masterAnalysis.anchorSec);
    const sGrid = createBeatGrid(slaveAnalysis.bpm, slaveAnalysis.anchorSec);

    const masterBeat = mGrid.getNearestBeatSec(mState.positionSec);

    // slave는 자기 그리드 기준으로 masterBeat "같은 박 번호"로 매핑할 수 없으니
    // 가장 가까운 slave beat를 찾아서 offset을 맞추는 방식(간단)
    const slaveNearest = sGrid.getNearestBeatSec(sState.positionSec);

    const delta = masterBeat - slaveNearest;

    // delta만큼 slave 위치를 이동(=박 정렬)
    const target = sState.positionSec + delta;
    slave.seek(target);
  }
}