import { database } from './firebase';
import { ref, set, get, remove } from 'firebase/database';

// Storage API using Firebase Realtime Database
const STORAGE_PREFIX = 'impostor_game_';

export const storage = {
  async set(key, value, isGlobal = false) {
    try {
      const storageKey = isGlobal ? `${STORAGE_PREFIX}${key}` : key;
      const dbRef = ref(database, storageKey);
      await set(dbRef, value);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  async get(key, isGlobal = false) {
    try {
      const storageKey = isGlobal ? `${STORAGE_PREFIX}${key}` : key;
      const dbRef = ref(database, storageKey);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        return { value: snapshot.val() };
      }
      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async remove(key, isGlobal = false) {
    try {
      const storageKey = isGlobal ? `${STORAGE_PREFIX}${key}` : key;
      const dbRef = ref(database, storageKey);
      await remove(dbRef);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
};

// Make storage available globally
if (typeof window !== 'undefined') {
  window.storage = storage;
}
