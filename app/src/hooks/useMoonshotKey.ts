import { useState, useCallback } from 'react';

const STORAGE_KEY = 'moonshot_api_key';

/**
 * Standalone getter — callable from orchestrator.ts without React.
 * Checks localStorage first, falls back to env var.
 */
export function getMoonshotKey(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // SSR / restricted context
  }
  const envKey = import.meta.env.VITE_MOONSHOT_API_KEY;
  return envKey || null;
}

/**
 * React hook for the Settings UI — read, save, clear the key.
 */
export function useMoonshotKey() {
  const [key, setKeyState] = useState<string | null>(() => getMoonshotKey());

  const setKey = useCallback((newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setKeyState(trimmed);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setKeyState(import.meta.env.VITE_MOONSHOT_API_KEY || null);
  }, []);

  const hasKey = Boolean(key);

  return { key, setKey, clearKey, hasKey };
}
