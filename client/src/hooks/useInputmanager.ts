import { useEffect, useRef } from 'react';
import { useDJStore } from '../store/useDJStore';

// 타입 정의 
type ActionType = 'HOLD' | 'TRIGGER';
type ControlTarget = 'mid' | 'bass' | 'filter' | 'fader' | 'crossFader' | 'bpm';

interface KeyCommand {
  deck?: 1 | 2;
  action: string;
  target?: ControlTarget;
  type?: ActionType;
}

// 키 매핑 정의
const KEY_MAP: Record<string, KeyCommand> = {
  // === DECK 1 (왼쪽) ===
  '1': { deck: 1, action: 'CUE1', type: 'TRIGGER' },
  '2': { deck: 1, action: 'CUE2', type: 'TRIGGER' },
  'Q': { deck: 1, action: 'UP', target: 'mid', type: 'HOLD' },
  'A': { deck: 1, action: 'DOWN', target: 'mid', type: 'HOLD' },
  'W': { deck: 1, action: 'UP', target: 'bass', type: 'HOLD' },
  'S': { deck: 1, action: 'DOWN', target: 'bass', type: 'HOLD' },
  'E': { deck: 1, action: 'UP', target: 'filter', type: 'HOLD' },
  'D': { deck: 1, action: 'DOWN', target: 'filter', type: 'HOLD' },
  'R': { deck: 1, action: 'UP', target: 'fader', type: 'HOLD' },
  'F': { deck: 1, action: 'DOWN', target: 'fader', type: 'HOLD' },
  'G': { deck: 1, action: 'PLAY', type: 'TRIGGER' },
  'V': { deck: 1, action: 'SCRATCH', type: 'HOLD' },
  'SHIFTLEFT': { deck: 1, action: 'UPLOAD', type: 'TRIGGER' },

  // === DECK 2 (오른쪽) ===
  '8': { deck: 2, action: 'CUE1', type: 'TRIGGER' },
  '9': { deck: 2, action: 'CUE2', type: 'TRIGGER' },
  'P': { deck: 2, action: 'UP', target: 'mid', type: 'HOLD' },
  ';': { deck: 2, action: 'DOWN', target: 'mid', type: 'HOLD' },
  'O': { deck: 2, action: 'UP', target: 'bass', type: 'HOLD' },
  'L': { deck: 2, action: 'DOWN', target: 'bass', type: 'HOLD' },
  'I': { deck: 2, action: 'UP', target: 'filter', type: 'HOLD' },
  'K': { deck: 2, action: 'DOWN', target: 'filter', type: 'HOLD' },
  'U': { deck: 2, action: 'UP', target: 'fader', type: 'HOLD' },
  'J': { deck: 2, action: 'DOWN', target: 'fader', type: 'HOLD' },
  'H': { deck: 2, action: 'PLAY', type: 'TRIGGER' },
  'N': { deck: 2, action: 'SCRATCH', type: 'HOLD' },
  'SHIFTRIGHT': { deck: 2, action: 'UPLOAD', type: 'TRIGGER' },

  // === 글로벌 컨트롤 & Mixer ===
  'SPACE': { action: 'BEAT_SYNC', type: 'TRIGGER' },
  'ARROWLEFT': { action: 'LEFT', target: 'crossFader', type: 'HOLD' },
  'ARROWRIGHT': { action: 'RIGHT', target: 'crossFader', type: 'HOLD' },
  'ARROWUP': { action: 'UP', target: 'bpm', type: 'TRIGGER' },
  'ARROWDOWN': { action: 'DOWN', target: 'bpm', type: 'TRIGGER' },

  'NUMPAD1': { action: 'CRUSH', type: 'TRIGGER' },
  'NUMPAD2': { action: 'FLANGER', type: 'TRIGGER' },
  'NUMPAD4': { action: 'SLICER', type: 'TRIGGER' },
  'NUMPAD5': { action: 'KICK', type: 'TRIGGER' },
  
};

// 오디오 엔진 인터페이스 (임시)
interface AudioEngine {
  decks: {
    [key: number]: {
      adjustParam: (target: ControlTarget, delta: number) => void;
      jumpToCue: (index: number) => void;
      togglePlay: () => void;
    };
  };
  mixer: {
    adjustCrossFader: (delta: number) => void;
    sync: () => void;
  };
}

export const useInputManager = (audioEngine: AudioEngine) => {
  const activeKeys = useRef<Set<string>>(new Set()); //현재 눌린 키키
  const requestRef = useRef<number | null>(null);
  
  // Zustand 액션 가져오기
  const { updateValue, setPlayState } = useDJStore.getState().actions;

  // e.code를 KEY_MAP에서 사용하는 문자열로 정규화
  // 예) KeyG -> "G", Digit1 -> "1", Semicolon -> ";", ShiftLeft -> "SHIFTLEFT"
  const normalizeKeyCode = (e: KeyboardEvent) => {
    const code = e.code.toUpperCase();
    if (code.startsWith('KEY')) return code.replace('KEY', '');
    if (code.startsWith('DIGIT')) return code.replace('DIGIT', '');
    if (code === 'SEMICOLON') return ';';
    return code;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // 검색창 입력 중일 때는 무시
    if (e.target instanceof HTMLInputElement) return;
    const keyCode = normalizeKeyCode(e);
    if (KEY_MAP[keyCode]) {
      e.preventDefault();
      if (!activeKeys.current.has(keyCode)) {
        activeKeys.current.add(keyCode);
        if (KEY_MAP[keyCode].type === 'TRIGGER') {
          executeTriggerAction(KEY_MAP[keyCode]);
        }
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const keyCode = normalizeKeyCode(e);
    activeKeys.current.delete(keyCode); 
  };

  const updateLoop = () => {
    activeKeys.current.forEach(key => {
      const command = KEY_MAP[key];
      // HOLD 타입의 키를 누르고 있으면 계속 실행
      if (command.type === 'HOLD') {
        processHoldAction(command);
      }
    });
    requestRef.current = requestAnimationFrame(updateLoop);
  };

  // HOLD 타입의 키를 처리하는 함수
  const processHoldAction = (command: KeyCommand) => {
    if (!command.target) return;
    const delta = command.action === 'UP' || command.action === 'RIGHT' ? 0.01 : -0.01;
    if (command.deck) {
      audioEngine.decks[command.deck].adjustParam(command.target, delta);
      updateValue(command.target, delta, command.deck); 
    }
    if (command.target === 'crossFader') {
      audioEngine.mixer.adjustCrossFader(delta);
      updateValue('crossFader', delta);
    }
  };
  
  // TRIGGER 타입의 키를 처리하는 함수
  const executeTriggerAction = (command: KeyCommand) => {
    if (command.deck) {
      if (command.action.startsWith('CUE')) {
        const idx = parseInt(command.action.replace('CUE', ''));
        audioEngine.decks[command.deck].jumpToCue(idx);
      }
      if (command.action === 'PLAY') {
        audioEngine.decks[command.deck].togglePlay();
        // UI 상태도 같이 토글 (Deck 1/2의 isplay)
        const state = useDJStore.getState();
        const current = command.deck === 1 ? state.deck1.isplay : state.deck2.isplay;
        setPlayState(command.deck, !current);
      }
    }
    if (command.action === 'BEAT_SYNC') {
      audioEngine.mixer.sync();
    }
    if (command.action === 'UPLOAD') {
      // 여기에 파일을 선택하는 창(Modal)을 띄우는 함수를 연결
      console.log("Deck 1 파일 업로드 모달 오픈!"); 
    }
    // BPM 조정 (TRIGGER 방식)
    if (command.target === 'bpm') {
      const delta = command.action === 'UP' ? 1 : -1;
      updateValue('bpm', delta);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    requestRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};