const ACCESS_KEY = "accessToken";
const SIGNUP_KEY = "signupToken";

export const authStore = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY);
  },
  setAccessToken(token: string) {
    localStorage.setItem(ACCESS_KEY, token);
  },
  getSignupToken() {
    return localStorage.getItem(SIGNUP_KEY);
  },
  setSignupToken(token: string) {
    if (!token) localStorage.removeItem(SIGNUP_KEY);
    else localStorage.setItem(SIGNUP_KEY, token);
  },
  isAuthed(): boolean {
    return !!localStorage.getItem(ACCESS_KEY);
  },
  clearAll() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(SIGNUP_KEY);
  },
  setToken(token: string) {
    this.setAccessToken(token);
  },
  clear() {
    this.clearAll();
  }
};