import { useRef, useState } from "react";
import { Room, LocalAudioTrack } from "livekit-client";
import { fetchLiveKitToken } from "../api/liveApi";

export function useLiveBroadcast() {
  const roomRef = useRef<Room | null>(null);
  const [isLive, setIsLive] = useState(false);

  const start = async (roomName: string, stream: MediaStream) => {
    if (isLive) return;

    const { token, url } = await fetchLiveKitToken(roomName, "DJ");

    const room = new Room();
    await room.connect(url, token);

    const mediaTrack = stream.getAudioTracks()[0];
    if (!mediaTrack) throw new Error("No audio track in provided stream");

    const lkTrack = new LocalAudioTrack(mediaTrack);
    await room.localParticipant.publishTrack(lkTrack);

    roomRef.current = room;
    setIsLive(true);
  };

  const stop = async () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setIsLive(false);
  };

  return { isLive, start, stop };
}