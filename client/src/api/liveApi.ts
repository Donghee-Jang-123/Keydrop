export type LiveRole = "DJ" | "VIEWER";

export async function fetchLiveKitToken(
  room: string,
  role: LiveRole
): Promise<{ token: string; url: string }> {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/api/live/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, role }),
      credentials: "include",
    }
  );

  if (!res.ok) {
    throw new Error(`Live token API failed: ${res.status}`);
  }

  return res.json();
}