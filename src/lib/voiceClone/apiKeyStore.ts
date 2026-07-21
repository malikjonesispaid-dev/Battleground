const STORAGE_KEY = "gordo-loops:elevenlabs-api-key";

export function getStoredApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setStoredApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key) window.localStorage.setItem(STORAGE_KEY, key);
  else window.localStorage.removeItem(STORAGE_KEY);
}
