import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeStorageGet, safeStorageRemove, safeStorageSet } from './safe-storage';

function createStorageMock() {
  const data = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => (data.has(key) ? data.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('safe-storage', () => {
  it('returns null/false when window is unavailable', () => {
    expect(safeStorageGet('x')).toBeNull();
    expect(safeStorageSet('x', '1')).toBe(false);
    expect(safeStorageRemove('x')).toBe(false);
  });

  it('reads and writes local storage values', () => {
    const localStorage = createStorageMock();
    const sessionStorage = createStorageMock();
    vi.stubGlobal('window', { localStorage, sessionStorage });

    expect(safeStorageSet('key', 'value')).toBe(true);
    expect(safeStorageGet('key')).toBe('value');
    expect(safeStorageRemove('key')).toBe(true);
    expect(safeStorageGet('key')).toBeNull();
  });

  it('reads and writes session storage values', () => {
    const localStorage = createStorageMock();
    const sessionStorage = createStorageMock();
    vi.stubGlobal('window', { localStorage, sessionStorage });

    expect(safeStorageSet('state', 'abc', 'session')).toBe(true);
    expect(safeStorageGet('state', 'session')).toBe('abc');
    expect(safeStorageRemove('state', 'session')).toBe(true);
    expect(safeStorageGet('state', 'session')).toBeNull();
  });

  it('swallows storage API errors from methods', () => {
    const localStorage = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      removeItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    };
    const sessionStorage = createStorageMock();
    vi.stubGlobal('window', { localStorage, sessionStorage });

    expect(safeStorageGet('x')).toBeNull();
    expect(safeStorageSet('x', '1')).toBe(false);
    expect(safeStorageRemove('x')).toBe(false);
  });

  it('swallows errors when localStorage getter throws', () => {
    const badWindow: Record<string, unknown> = {};
    Object.defineProperty(badWindow, 'localStorage', {
      get() {
        throw new Error('denied');
      },
    });
    Object.defineProperty(badWindow, 'sessionStorage', {
      get() {
        throw new Error('denied');
      },
    });
    vi.stubGlobal('window', badWindow);

    expect(safeStorageGet('x')).toBeNull();
    expect(safeStorageSet('x', '1')).toBe(false);
    expect(safeStorageRemove('x')).toBe(false);
  });
});
