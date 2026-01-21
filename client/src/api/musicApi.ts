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
  // Use native fetch to avoid Authorization header injection by axios interceptor
  // and to ensure a simple GET request for static resources.
  const response = await fetch(resolved);
  if (!response.ok) {
    throw new Error(`Failed to fetch music: ${response.status} ${response.statusText}`);
  }
  return await response.blob();
}
