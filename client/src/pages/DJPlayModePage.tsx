import { useEffect, useRef, useState } from 'react';
import { useKeyManager } from '../hooks/useKeyManager';
import { audioEngine } from '../services/audioEngine';
import { useDJStore } from '../store/useDJStore';
import { fetchMusicBlobByUrl } from '../api/musicApi';
import { uploadRecording } from '../api/recordingApi';
import LibraryPanel from '../components/audio/LibraryPanel';
import DJHeader from '../components/DJHeader';

function fmtTime(sec: number | undefined) {
  const s = Math.max(0, Math.floor(sec ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// viewerMode에서만 훅 호출을 막기 위한 게이트
function DJKeyManagerGate({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  useKeyManager(audioEngine);
  return null;
}

type Props = {
  viewerMode?: boolean;
};

export default function DJPlayModePage({ viewerMode = false }: Props) {
  // viewer면 키 입력/컨트롤 로직 전부 OFF
  const controlsEnabled = !viewerMode;

  const pendingDbLoad = useDJStore((s) => s.pendingDbLoad);
  const filePickerDeck = useDJStore((s) => s.filePickerDeck);

  const {
    clearLocalFileRequest,
    setTrackTitle,
    setPlayState,
    setDeckMetaFromDb,
    clearDbLoadRequest,
    setPositionSec,
    setDurationSec,
    setCues,
  } = useDJStore((s) => s.actions);

  const deck1 = useDJStore((s) => s.deck1);
  const deck2 = useDJStore((s) => s.deck2);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingDeckRef = useRef<1 | 2 | null>(null);

  const cross = useDJStore((s) => s.crossFader);

  const [masterBpm, setMasterBpm] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingRecordingFile, setPendingRecordingFile] = useState<File | null>(null);

  useEffect(() => {
    if (!controlsEnabled) return; // viewer면 file picker 트리거도 막기
    if (!filePickerDeck) return;
    pendingDeckRef.current = filePickerDeck;
    fileInputRef.current?.click();
  }, [filePickerDeck, controlsEnabled]);

  useEffect(() => {
    if (!controlsEnabled) return; // viewer면 DB 로드 로직 막기
    if (!pendingDbLoad) return;

    const { deckIdx, track } = pendingDbLoad;
    let cancelled = false;

    (async () => {
      try {
        setPlayState(deckIdx, false);

        if (!track.mp3Url) throw new Error('track.mp3Url is missing');

        const blob = await fetchMusicBlobByUrl(track.mp3Url);

        const name = `${track.title ?? 'track'}.mp3`;
        const file = new File([blob], name, { type: blob.type || 'audio/mpeg' });
        audioEngine.decks[deckIdx].loadFile(file, track.bpm ?? 0);

        setDeckMetaFromDb(deckIdx, {
          title: track.title ?? 'Unknown',
          artist: track.artists ?? '',
          bpm: track.bpm ?? 0,
          durationSec: track.duration ?? 0,
          coverUrl: track.imageUrl ?? null,
        });
        setTrackTitle(deckIdx, track.title ?? name);
      } catch (err) {
        console.error('[pendingDbLoad] failed', err);
      } finally {
        if (!cancelled) clearDbLoadRequest();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pendingDbLoad,
    controlsEnabled,
    setPlayState,
    setDeckMetaFromDb,
    setTrackTitle,
    clearDbLoadRequest,
  ]);

  useEffect(() => {
    if (!controlsEnabled) return; // viewer면 tick/interval 전부 OFF

    const tick = () => {
      const s1 = audioEngine.peekDeckState(1);
      const s2 = audioEngine.peekDeckState(2);

      if (s1) {
        setPositionSec(1, s1.positionSec);
        setDurationSec(1, s1.durationSec);
        setCues(1, s1.cues ?? {});
      }

      if (s2) {
        setPositionSec(2, s2.positionSec);
        setDurationSec(2, s2.durationSec);
        setCues(2, s2.cues ?? {});
      }

      if (!s1 && !s2) return;

      const a1 = audioEngine.getAnalyzedBpm(1);
      const a2 = audioEngine.getAnalyzedBpm(2);

      let bpm = 0;

      if (s1?.isPlaying && !s2?.isPlaying && a1) {
        bpm = a1 * s1.playbackRate;
      } else if (!s1?.isPlaying && s2?.isPlaying && a2) {
        bpm = a2 * s2.playbackRate;
      } else if (s1?.isPlaying && s2?.isPlaying) {
        const useDeck2 = cross >= 0;
        if (useDeck2 && a2) bpm = a2 * s2.playbackRate;
        if (!useDeck2 && a1) bpm = a1 * s1.playbackRate;
      }

      setMasterBpm((prev) => (Math.abs(prev - bpm) > 0.1 ? bpm : prev));
    };

    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [cross, controlsEnabled, setPositionSec, setDurationSec, setCues]);

  const deck1Meta = {
    title: deck1.trackTitle,
    artist: deck1.artist ?? '',
    bpm: deck1.trackBpm ?? 0,
    time: fmtTime(deck1.positionSec),
    duration: deck1.durationSec ? fmtTime(deck1.durationSec) : '-',
  };

  const deck2Meta = {
    title: deck2.trackTitle,
    artist: deck2.artist ?? '',
    bpm: deck2.trackBpm ?? 0,
    time: fmtTime(deck2.positionSec),
    duration: deck2.durationSec ? fmtTime(deck2.durationSec) : '-',
  };

  return (
    <>
      <DJKeyManagerGate enabled={controlsEnabled} />

      <DJHeader
        deck1Meta={deck1Meta}
        deck2Meta={deck2Meta}
        masterBpm={masterBpm}
        isRecording={isRecording}
        fileInputRef={fileInputRef}
        onFileChange={
          controlsEnabled
            ? async (e) => {
                const deck = pendingDeckRef.current;
                const file = e.target.files?.[0];
                e.currentTarget.value = '';

                clearLocalFileRequest();
                pendingDeckRef.current = null;
                if (!deck || !file) return;

                try {
                  setPlayState(deck, false);
                  setTrackTitle(deck, file.name);
                  audioEngine.decks[deck].loadFile(file, 0);
                } catch (err) {
                  console.error('[loadFile] failed', err);
                }
              }
            : async () => {} // viewer에서는 의미없음
        }
        showSaveModal={showSaveModal}
        onCloseSaveModal={() => {
          setShowSaveModal(false);
          setPendingRecordingFile(null);
        }}
        onSaveRecording={
          controlsEnabled
            ? async (filename) => {
                if (!pendingRecordingFile) return;
                try {
                  const ext = pendingRecordingFile.name.split('.').pop() || 'webm';
                  const safeBase = filename.trim().replace(/[\\/:*?"<>|]/g, '-');
                  const finalName = safeBase.endsWith(`.${ext}`) ? safeBase : `${safeBase}.${ext}`;

                  const finalFile = new File([pendingRecordingFile], finalName, {
                    type: pendingRecordingFile.type,
                  });

                  await uploadRecording(finalFile);

                  setShowSaveModal(false);
                  setPendingRecordingFile(null);
                } catch (e) {
                  console.error('upload failed', e);
                }
              }
            : async () => {}
        }
        onToggleRecord={
          controlsEnabled
            ? async () => {
                try {
                  if (!audioEngine.recorder.isRecording()) {
                    await audioEngine.recorder.start();
                    setIsRecording(true);
                    return;
                  }

                  const blob = await audioEngine.recorder.stop();
                  setIsRecording(false);

                  const ext = blob.type.includes('ogg') ? 'ogg' : 'webm';
                  const tmpName = `keydrop-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
                  const file = new File([blob], tmpName, { type: blob.type || `audio/${ext}` });

                  setPendingRecordingFile(file);
                  setShowSaveModal(true);
                } catch (err) {
                  console.error('[record] failed', err);
                  setIsRecording(audioEngine.recorder.isRecording());
                }
              }
            : async () => {}
        }
        // viewer면 라이브러리 패널 숨김
        libraryElement={viewerMode ? null : <LibraryPanel />}
        // DJHeader/DJLayout에서 viewerMode UI 잠금에 쓰고 싶으면 같이 넘겨도 됨
        viewerMode={viewerMode as any}
      />
    </>
  );
}