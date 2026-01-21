import { useEffect, useRef, useState } from 'react';
import { useKeyManager } from '../hooks/useKeyManager';
import { audioEngine } from '../services/audioEngine';
import { useDJStore } from '../store/useDJStore';
import { fetchMusicBlobByUrl } from '../api/musicApi';
import { uploadRecording } from '../api/recordingApi';
import AudioVisualizer from "../components/audio/AudioVisualizer";
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
  console.log("[DJPlayModePage] viewerMode:", viewerMode);
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
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [pendingRecordingFile, setPendingRecordingFile] = useState<File | null>(null);

  useEffect(() => {
    // ...
    // ...
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
          : async () => { } // viewer에서는 의미없음
      }
      showSaveModal={showSaveModal}
      onCloseSaveModal={() => {
        setShowSaveModal(false);
        setPendingRecordingFile(null);
      }}
      showSaveSuccess={showSaveSuccess}
      onCloseSaveSuccess={() => setShowSaveSuccess(false)}
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
              setShowSaveSuccess(true);
            } catch (e) {
              console.error('upload failed', e);
            }
          }
          : async () => { }
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
              audioEngine.stopAll();

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
          : async () => { }
      }
      // viewer면 라이브러리 패널 숨김
      libraryElement={viewerMode ? <AudioVisualizer /> : <LibraryPanel />}
      // DJHeader/DJLayout에서 viewerMode UI 잠금에 쓰고 싶으면 같이 넘겨도 됨
      viewerMode={viewerMode as any}
    />
    </>
  );
}