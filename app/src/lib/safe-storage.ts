type StorageArea = 'local' | 'session';

function getStorage(area: StorageArea): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return area === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function safeStorageGet(key: string, area: StorageArea = 'local'): string | null {
  const storage = getStorage(area);
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string, area: StorageArea = 'local'): boolean {
  const storage = getStorage(area);
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeStorageRemove(key: string, area: StorageArea = 'local'): boolean {
  const storage = getStorage(area);
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
