import type { Music } from "../types/music";

export async function fetchMusicList(): Promise<Music[]> {
  const res = await fetch(`/api/music`);
  if (!res.ok) throw new Error(`fetchMusicList failed: ${res.status}`);
  return res.json() as Promise<Music[]>;
}

export function resolveMusicUrl(url: string): string {
  if (url.startsWith("http")) return url;
  return url;
}

export async function fetchMusicBlobByUrl(url: string): Promise<Blob> {
  const resolved = resolveMusicUrl(url);
  const res = await fetch(resolved);
  if (!res.ok) throw new Error(`fetchMusicBlobByUrl failed: ${res.status}`);
  return await res.blob();
}