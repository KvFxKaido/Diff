import { useCallback, useEffect, useState } from 'react';

const GLOBAL_DEFAULT_KEY = 'protect_main_default';

export type RepoOverride = 'inherit' | 'always' | 'never';

function repoKey(repoFullName: string): string {
  return `protect_main_${repoFullName}`;
}

function loadGlobalDefault(): boolean {
  try {
    return localStorage.getItem(GLOBAL_DEFAULT_KEY) === 'true';
  } catch {
    return false;
  }
}

function loadRepoOverride(repoFullName?: string): RepoOverride {
  if (!repoFullName) return 'inherit';
  try {
    const raw = localStorage.getItem(repoKey(repoFullName));
    if (raw === 'always' || raw === 'never') return raw;
    return 'inherit';
  } catch {
    return 'inherit';
  }
}

/**
 * Standalone (non-hook) getter for use in library code that can't call hooks.
 * Returns true if main branch protection is active for the given repo.
 */
export function getIsMainProtected(repoFullName?: string): boolean {
  const override = loadRepoOverride(repoFullName);
  if (override === 'always') return true;
  if (override === 'never') return false;
  return loadGlobalDefault();
}

export function useProtectMain(repoFullName?: string) {
  const [globalDefault, setGlobalDefaultState] = useState(loadGlobalDefault);
  const [repoOverride, setRepoOverrideState] = useState<RepoOverride>(() =>
    loadRepoOverride(repoFullName),
  );

  // Reload repo override when repo changes
  useEffect(() => {
    setRepoOverrideState(loadRepoOverride(repoFullName));
  }, [repoFullName]);

  const setGlobalDefault = useCallback((value: boolean) => {
    localStorage.setItem(GLOBAL_DEFAULT_KEY, String(value));
    setGlobalDefaultState(value);
  }, []);

  const setRepoOverride = useCallback(
    (value: RepoOverride) => {
      if (repoFullName) {
        if (value === 'inherit') {
          localStorage.removeItem(repoKey(repoFullName));
        } else {
          localStorage.setItem(repoKey(repoFullName), value);
        }
      }
      setRepoOverrideState(value);
    },
    [repoFullName],
  );

  const isProtected =
    repoOverride === 'always'
      ? true
      : repoOverride === 'never'
        ? false
        : globalDefault;

  return {
    isProtected,
    globalDefault,
    setGlobalDefault,
    repoOverride,
    setRepoOverride,
  };
}
