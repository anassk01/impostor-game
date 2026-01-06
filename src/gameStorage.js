// ============================================
// STORAGE HELPERS
// ============================================
const getGameKey = (code) => `impostor:${code}`;

export const loadGame = async (roomCode) => {
  try {
    const result = await window.storage.get(getGameKey(roomCode), true);
    return result ? JSON.parse(result.value) : null;
  } catch { return null; }
};

export const saveGame = async (game) => {
  try {
    await window.storage.set(getGameKey(game.roomCode), JSON.stringify(game), true);
    return true;
  } catch { return false; }
};
