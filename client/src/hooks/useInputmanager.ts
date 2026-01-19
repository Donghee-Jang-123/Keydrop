import { useEffect, useRef } from 'react';
import { useDJStore } from '../store/useDJStore';

// 타입 정의 
type ActionType = 'HOLD' | 'TRIGGER';
type ControlTarget = 'mid' | 'bass' | 'filter' | 'fader' | 'crossFader' | 'bpm';
type FxType = 'CRUSH' | 'FLANGER' | 'SLICER' | 'KICK';

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
  'SHIFTLEFT': { deck: 1, action: 'LOAD', type: 'TRIGGER' },

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
  'SHIFTRIGHT': { deck: 2, action: 'LOAD', type: 'TRIGGER' },

  // === 글로벌 컨트롤 & Mixer ===
  'TAB': { action: 'NEXT_TRACK', type: 'TRIGGER' },
  'SPACE': { action: 'BEAT_SYNC', type: 'TRIGGER' },
  'ARROWLEFT': { action: 'LEFT', target: 'crossFader', type: 'HOLD' },
  'ARROWRIGHT': { action: 'RIGHT', target: 'crossFader', type: 'HOLD' },
  'ARROWUP': { action: 'UP', target: 'bpm', type: 'TRIGGER' },
  'ARROWDOWN': { action: 'DOWN', target: 'bpm', type: 'TRIGGER' },

  'NUMPAD1': { action: 'CRUSH', type: 'TRIGGER' },
  'NUMPAD2': { action: 'FLANGER', type: 'TRIGGER' },
  'NUMPAD4': { action: 'SLICER', type: 'TRIGGER' },
  'NUMPAD5': { action: 'KICK', type: 'TRIGGER' },
  'NUMPADENTER': { action: 'FX_TOGGLE_DECK', type: 'TRIGGER' },
  
};

// 오디오 엔진 인터페이스 (임시)
interface AudioEngine {
  decks: {
    [key: number]: {
      adjustParam: (target: ControlTarget, delta: number) => void;
      jumpToCue: (index: number) => void;
      togglePlay: () => void;
      applyFx: (fx: FxType | null) => void;
      startScratchHold: (options?: { grainMs?: number; jumpMs?: number; intensity?: number }) => void;
      stopScratchHold: () => void;
    };
  };
  mixer: {
    adjustCrossFader: (delta: number) => void;
    sync: () => void;
  };
}

export const useInputManager = (audioEngine: AudioEngine) => {
  console.log('[IM] hook mounted');
  const activeKeys = useRef<Set<string>>(new Set()); //현재 눌린 키키
  const requestRef = useRef<number | null>(null);
  const activeFxKeyDeck = useRef<Map<string, 1 | 2>>(new Map()); // FX 키를 누르기 시작했을 때의 타겟 덱을 기억
  
  // Zustand 액션 가져오기
  const { updateValue, toggleFxTargetDeck, setFx, requestLocalFile, selectNextTrack, requestLoadSelectedToDeck, setControlActive } =
    useDJStore.getState().actions;

  const getControlId = (cmd: KeyCommand): string | null => {
    if (cmd.type !== 'HOLD') return null;
    if (cmd.target === 'crossFader') return 'cross';
    if (cmd.deck && cmd.target) return `deck${cmd.deck}:${cmd.target}`;
    return null;
  };

  // e.code를 KEY_MAP에서 사용하는 문자열로 정규화
  // 예) KeyG -> "G", Digit1 -> "1", Semicolon -> ";", ShiftLeft -> "SHIFTLEFT"
  const normalizeKeyCode = (e: KeyboardEvent) => {
    if (e.code === 'ShiftLeft') return 'SHIFTLEFT';
    if (e.code === 'ShiftRight') return 'SHIFTRIGHT';

    const code = e.code.toUpperCase();
    if (code.startsWith('KEY')) return code.replace('KEY', '');
    if (code.startsWith('DIGIT')) return code.replace('DIGIT', '');
    if (code === 'SEMICOLON') return ';';
    return code;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    console.log('[IM] keydown raw', e.code, e.key, e.location);
    let keyCode = normalizeKeyCode(e);

    if (
      e.code === 'ShiftRight' ||
      (e.key === 'Shift' && e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) ||
      (e.key === 'Shift' && e.code === '' && e.location === 0) // ✅ 이거 추가
    ) {
      keyCode = 'SHIFTRIGHT';
    }

    const isTyping =
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.isContentEditable);
    
    const allowWhenTyping = keyCode === 'SHIFTLEFT' || keyCode === 'SHIFTRIGHT' || keyCode === 'TAB';
    
    if (isTyping && !allowWhenTyping) return;

    if (KEY_MAP[keyCode]) {
      e.preventDefault();
      if (!activeKeys.current.has(keyCode)) {
        activeKeys.current.add(keyCode);

        const cmd = KEY_MAP[keyCode];

        // FX 키는 "누르는 동안만 ON" (keydown에서 ON 처리)
        if (cmd.action === 'CRUSH' || cmd.action === 'FLANGER' || cmd.action === 'SLICER' || cmd.action === 'KICK') {
          const fx = cmd.action as FxType;
          const state = useDJStore.getState();
          const targetDeck = state.fxTargetDeck;
          activeFxKeyDeck.current.set(keyCode, targetDeck);
          setFx(fx, targetDeck);
          audioEngine.decks[targetDeck].applyFx(fx);
          return;
        }

        // HOLD 컨트롤은 "조작 중" 표시 ON
        const cid = getControlId(cmd);
        if (cid) setControlActive(cid, true);

        if (cmd.type === 'TRIGGER') executeTriggerAction(cmd);
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    let keyCode = normalizeKeyCode(e);

    if (
      e.code === 'ShiftRight' ||
      (e.key === 'Shift' && e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT) ||
      (e.key === 'Shift' && e.code === '' && e.location === 0) // ✅ 이거 추가
    ) {
      keyCode = 'SHIFTRIGHT';
    }

    activeKeys.current.delete(keyCode); 

    // FX 키는 keyup에서 OFF 처리
    const cmd = KEY_MAP[keyCode];
    if (!cmd) return;

    // HOLD 컨트롤은 "조작 중" 표시 OFF
    const cid = getControlId(cmd);
    if (cid) setControlActive(cid, false);
    if (cmd.action === 'CRUSH' || cmd.action === 'FLANGER' || cmd.action === 'SLICER' || cmd.action === 'KICK') {
      const deckAtKeyDown = activeFxKeyDeck.current.get(keyCode);
      if (!deckAtKeyDown) return;
      activeFxKeyDeck.current.delete(keyCode);
      setFx(null, deckAtKeyDown);
      audioEngine.decks[deckAtKeyDown].applyFx(null);
    }

    if (cmd.action === 'SCRATCH' && cmd.deck) {
      audioEngine.decks[cmd.deck].stopScratchHold();
    }
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
    if (command.action === 'SCRATCH' && command.deck) {
      audioEngine.decks[command.deck].startScratchHold({
        grainMs: 45,
        jumpMs: 22,
        intensity: 1.0,
      });
      return;
    }
    
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
      }
      if (command.action === 'LOAD') {
        requestLoadSelectedToDeck(command.deck);
      }
    }
    if (command.action === 'NEXT_TRACK') {
      selectNextTrack();
    }
    if (command.action === 'BEAT_SYNC') {
      audioEngine.mixer.sync();
    }
    if (command.action === 'UPLOAD') {
      // 로컬 파일 선택창 열기 (Deck별)
      if (command.deck) requestLocalFile(command.deck);
    }

    // NUMPAD ENTER: FX 적용 대상 덱 토글 (Deck1 <-> Deck2)
    if (command.action === 'FX_TOGGLE_DECK') {
      toggleFxTargetDeck();
      const next = useDJStore.getState().fxTargetDeck;
      console.log(`[FX] 적용 대상 덱 변경: Deck ${next}`);
    }
    // BPM 조정 (TRIGGER 방식)
    if (command.target === 'bpm') {
      const delta = command.action === 'UP' ? 1 : -1;
      updateValue('bpm', delta);
    }
  };

  useEffect(() => {
    console.log('[IM] effect attach listeners');
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    requestRef.current = requestAnimationFrame(updateLoop);

  return () => {
    console.log('[IM] effect cleanup listeners');
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('keyup', handleKeyUp, true);
    if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
  };
}, []);
};