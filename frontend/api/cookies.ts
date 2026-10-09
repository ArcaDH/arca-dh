const COOKIE_NAME = "auth_token";

// Read the JWT from the browser cookie store. Returns null on SSR or when absent
export function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Persist the JWT in a cookie that lives for 7 days
export function setTokenCookie(token: string): void {
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

// Remove the auth cookie (effectively logs the user out client-side)
export function clearTokenCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}

// True when an auth cookie is present in the browser
export function isAuthenticated(): boolean {
  return getTokenFromCookie() !== null;
}
