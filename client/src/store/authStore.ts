const KEY = "accessToken";

export const authStore = {
  getToken(): string | null {
    return localStorage.getItem(KEY);
  },
  isAuthed(): boolean {
    return !!localStorage.getItem(KEY);
  },
  setToken(token: string) {
    localStorage.setItem(KEY, token);
  },
  clear() {
    localStorage.removeItem(KEY);
  },
};