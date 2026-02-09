import { useState, useCallback } from 'react';
import type { UserProfile } from '../types';
import { USER_PROFILE_DEFAULTS } from '../types';

const STORAGE_KEY = 'push_user_profile';
const MAX_BIO_LENGTH = 300;

/**
 * Standalone getter — callable from orchestrator.ts without React.
 * Returns full profile with defaults for any missing fields.
 */
export function getUserProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...USER_PROFILE_DEFAULTS, ...parsed };
    }
  } catch {
    // Corrupted data or restricted context — return defaults
  }
  return { ...USER_PROFILE_DEFAULTS };
}

/**
 * React hook for Settings UI — manage user profile (name, bio, GitHub login).
 */
export function useUserProfile() {
  const [profile, setProfileState] = useState<UserProfile>(() => getUserProfile());

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const merged = { ...prev, ...partial };
      // Cap bio length
      if (merged.bio.length > MAX_BIO_LENGTH) {
        merged.bio = merged.bio.slice(0, MAX_BIO_LENGTH);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfileState({ ...USER_PROFILE_DEFAULTS });
  }, []);

  return { profile, updateProfile, clearProfile };
}
