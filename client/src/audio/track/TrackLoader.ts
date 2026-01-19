export class TrackLoader {
  async loadFromUrl(url: string, ctx: AudioContext): Promise<AudioBuffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer;
  }
}