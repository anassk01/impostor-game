// Simple storage API using localStorage
const STORAGE_PREFIX = 'impostor_game_';

export const storage = {
  async set(key, value, isGlobal = false) {
    try {
      const storageKey = isGlobal ? `${STORAGE_PREFIX}${key}` : key;
      localStorage.setItem(storageKey, value);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  async get(key, isGlobal = false) {
    try {
      const storageKey = isGlobal ? `${STORAGE_PREFIX}${key}` : key;
      const value = localStorage.getItem(storageKey);
      return value ? { value } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async remove(key, isGlobal = false) {
    try {
      const storageKey = isGlobal ? `${STORAGE_PREFIX}${key}` : key;
      localStorage.removeItem(storageKey);
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
