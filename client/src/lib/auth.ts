export type UserRole = "teacher" | "parent" | "student" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  display_name?: string;
}

const TOKEN_KEY = "makermind_token";
const USER_KEY = "makermind_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) clearAuth();
  return res;
}

export function displayName(user: AuthUser | null): string {
  if (!user) return "";
  return user.displayName || user.display_name || user.email || "用户";
}

/** 供 legacy generator.js 使用 */
export function installLegacyAuthBridge(): void {
  (window as unknown as { MMAuth?: Record<string, unknown> }).MMAuth = {
    getToken,
    getCurrentUser,
    isLoggedIn,
    setAuth,
    clearAuth,
    logout: () => {
      clearAuth();
      window.location.href = "/";
    },
    authFetch,
    requireAuth: (redirect?: string) => {
      if (!isLoggedIn()) {
        const back = redirect || window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(back)}`;
        return false;
      }
      return true;
    },
    injectNavAuth: () => {}
  };
}
