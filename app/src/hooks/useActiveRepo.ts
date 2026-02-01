import { useCallback, useState } from 'react';
import type { ActiveRepo } from '../types';

const STORAGE_KEY = 'active_repo';

function loadFromStorage(): ActiveRepo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveRepo;
  } catch {
    return null;
  }
}

export function useActiveRepo() {
  const [activeRepo, setActiveRepoState] = useState<ActiveRepo | null>(loadFromStorage);

  const setActiveRepo = useCallback((repo: ActiveRepo) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repo));
    setActiveRepoState(repo);
  }, []);

  const clearActiveRepo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveRepoState(null);
  }, []);

  return { activeRepo, setActiveRepo, clearActiveRepo };
}
