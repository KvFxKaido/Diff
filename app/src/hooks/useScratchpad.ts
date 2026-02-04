/**
 * useScratchpad — manages a shared notepad for the session.
 *
 * Both the user and Kimi can read/write. Content persists in localStorage.
 * The scratchpad is always visible to Kimi in the system prompt.
 *
 * Security notes:
 * - localStorage is unencrypted; users should avoid pasting sensitive data
 * - Content size is soft-capped at 500KB to prevent quota issues
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'push-scratchpad';
const MAX_STORAGE_SIZE = 500_000; // 500KB soft cap for localStorage

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

  // Auto-save on change with error feedback
  useEffect(() => {
    // Warn if content is getting large (but still try to save)
    if (content.length > MAX_STORAGE_SIZE) {
      toast.warning('Scratchpad is very large — consider clearing old notes');
    }

    try {
      localStorage.setItem(STORAGE_KEY, content);
    } catch (e) {
      // Handle quota exceeded or disabled localStorage
      if (e instanceof Error) {
        if (e.name === 'QuotaExceededError') {
          toast.error('Scratchpad too large to save — clear some content');
        } else {
          console.error('[useScratchpad] localStorage error:', e.message);
        }
      }
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
