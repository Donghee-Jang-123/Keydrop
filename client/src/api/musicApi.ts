import type { Music } from "../types/music";
import { api } from "./authApi";

export async function fetchMusicList(): Promise<Music[]> {
  const { data } = await api.get<Music[]>("/api/music");
  return data;
}

function getApiBaseUrl(): string {
  const base = api.defaults.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? "";
  return typeof base === "string" ? base.replace(/\/+$/, "") : "";
}

export function resolveMusicUrl(url: string): string {
  if (url.startsWith("http")) return url;
  const base = getApiBaseUrl();
  if (!base) return url;

  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}

export async function fetchMusicBlobByUrl(url: string): Promise<Blob> {
  const resolved = resolveMusicUrl(url);
  const res = await api.get(resolved, { responseType: "blob" });
  return res.data as Blob;
}
