import { useState, useCallback } from 'react';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '@/lib/safe-storage';

const STORAGE_KEY = 'tavily_api_key';

/**
 * Standalone getter — callable from web-search-tools.ts without React.
 * Checks localStorage first, falls back to env var.
 */
export function getTavilyKey(): string | null {
  const stored = safeStorageGet(STORAGE_KEY);
  if (stored) return stored;
  const envKey = import.meta.env.VITE_TAVILY_API_KEY;
  return envKey || null;
}

/**
 * React hook for the Settings UI — read, save, clear the Tavily key.
 *
 * Tavily is optional. When set, it upgrades web search quality for all
 * providers. When absent, DuckDuckGo (free) or provider-native search
 * handles queries instead.
 */
export function useTavilyConfig() {
  const [key, setKeyState] = useState<string | null>(() => getTavilyKey());

  const setKey = useCallback((newKey: string) => {
    const trimmed = newKey.trim();
    if (!trimmed) return;
    safeStorageSet(STORAGE_KEY, trimmed);
    setKeyState(trimmed);
  }, []);

  const clearKey = useCallback(() => {
    safeStorageRemove(STORAGE_KEY);
    setKeyState(import.meta.env.VITE_TAVILY_API_KEY || null);
  }, []);

  const hasKey = Boolean(key);

  return { key, setKey, clearKey, hasKey };
}
