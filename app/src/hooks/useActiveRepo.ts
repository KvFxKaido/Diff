import { useCallback, useState } from 'react';
import type { ActiveRepo } from '../types';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from '@/lib/safe-storage';

const STORAGE_KEY = 'active_repo';

function loadFromStorage(): ActiveRepo | null {
  try {
    const raw = safeStorageGet(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveRepo;
  } catch {
    return null;
  }
}

export function useActiveRepo() {
  const [activeRepo, setActiveRepoState] = useState<ActiveRepo | null>(loadFromStorage);

  const setActiveRepo = useCallback((repo: ActiveRepo) => {
    safeStorageSet(STORAGE_KEY, JSON.stringify(repo));
    setActiveRepoState(repo);
  }, []);

  const clearActiveRepo = useCallback(() => {
    safeStorageRemove(STORAGE_KEY);
    setActiveRepoState(null);
  }, []);

  const setCurrentBranch = useCallback((branch: string) => {
    setActiveRepoState((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, current_branch: branch };
      safeStorageSet(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { activeRepo, setActiveRepo, clearActiveRepo, setCurrentBranch };
}
