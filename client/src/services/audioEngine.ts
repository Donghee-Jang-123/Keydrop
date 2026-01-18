// 오디오 엔진 더미 구현 (실제 오디오 처리는 나중에 추가)
// 지금은 "키 입력 → UI 업데이트"만 확인하기 위한 껍데기

export type ControlTarget = 'mid' | 'bass' | 'filter' | 'fader' | 'crossFader' | 'bpm';

class DeckController {
  private deckNumber: number;

  constructor(deckNumber: number) {
    this.deckNumber = deckNumber;
  }

  adjustParam(target: ControlTarget, delta: number): void {
    // 실제 오디오 파라미터 조정은 여기서 구현
    console.log(`[Deck ${this.deckNumber}] ${target} 조정: ${delta > 0 ? '+' : ''}${delta.toFixed(3)}`);
  }

  jumpToCue(index: number): void {
    console.log(`[Deck ${this.deckNumber}] Cue ${index}로 점프`);
  }

  togglePlay(): void {
    console.log(`[Deck ${this.deckNumber}] 재생/정지 토글`);
  }
}

class MixerController {
  adjustCrossFader(delta: number): void {
    console.log(`[Mixer] CrossFader 조정: ${delta > 0 ? '+' : ''}${delta.toFixed(3)}`);
  }

  sync(): void {
    console.log('[Mixer] 비트 싱크 실행');
  }
}

// AudioEngine 싱글톤
export class AudioEngine {
  public decks: { [key: number]: DeckController };
  public mixer: MixerController;

  constructor() {
    this.decks = {
      1: new DeckController(1),
      2: new DeckController(2),
    };
    this.mixer = new MixerController();
  }
}

// 전역 인스턴스 생성
export const audioEngine = new AudioEngine();
