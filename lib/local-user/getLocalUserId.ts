import { v4 as uuidv4 } from 'uuid';

const LOCAL_USER_ID_KEY = 'levl_local_user_id';

/**
 * Gets the local_user_id from localStorage, or generates a new one if it doesn't exist.
 * This bridges the gap for user-specific data until Supabase Auth is implemented.
 */
export function getLocalUserId(): string {
  if (typeof window === 'undefined') {
    return ''; // Return empty string during SSR
  }

  let localUserId = localStorage.getItem(LOCAL_USER_ID_KEY);

  if (!localUserId) {
    localUserId = uuidv4();
    localStorage.setItem(LOCAL_USER_ID_KEY, localUserId);
  }

  return localUserId;
}
