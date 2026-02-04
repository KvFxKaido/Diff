/**
 * useScratchpad — manages a shared notepad for the session.
 *
 * Both the user and Kimi can read/write. Content persists in localStorage.
 * The scratchpad is always visible to Kimi in the system prompt.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'push-scratchpad';

export interface ScratchpadState {
  isOpen: boolean;
  content: string;
}

export function useScratchpad() {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  // Auto-save on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, content);
    } catch {
      // localStorage might be full or disabled
    }
  }, [content]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const clear = useCallback(() => setContent(''), []);

  const append = useCallback((text: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${text}` : text;
    });
  }, []);

  const replace = useCallback((text: string) => {
    setContent(text);
  }, []);

  const hasContent = content.trim().length > 0;

  return {
    isOpen,
    content,
    hasContent,
    toggle,
    open,
    close,
    clear,
    append,
    replace,
    setContent,
  };
}

export type UseScratchpadReturn = ReturnType<typeof useScratchpad>;
