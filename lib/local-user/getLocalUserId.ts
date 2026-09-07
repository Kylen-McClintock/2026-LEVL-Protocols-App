import { v4 as uuidv4 } from 'uuid';

const LOCAL_USER_ID_KEY = 'levl_local_user_id';
let inMemoryUserId: string | null = null;

/**
 * Gets the local_user_id from localStorage, or generates a new one if it doesn't exist.
 * Hardened with defensive try/catch and in-memory fallback for macOS Web Apps / strict sandboxes.
 */
export function getLocalUserId(): string {
  if (typeof window === 'undefined') {
    return ''; // Return empty string during SSR
  }

  try {
    let localUserId = localStorage.getItem(LOCAL_USER_ID_KEY);

    if (!localUserId) {
      localUserId = 'guest_' + uuidv4();
      try {
        localStorage.setItem(LOCAL_USER_ID_KEY, localUserId);
        localStorage.setItem('levl_active_is_guest', 'true');
      } catch (e) {
        // Storage write restricted, continue with generated id
      }
    }

    return localUserId;
  } catch (err) {
    // If localStorage read fails (e.g. security error in Mac web app sandbox), use in-memory fallback
    if (!inMemoryUserId) {
      inMemoryUserId = 'guest_' + uuidv4();
    }
    return inMemoryUserId;
  }
}
