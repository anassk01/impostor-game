// ============================================
// STORAGE HELPERS
// ============================================
const getGameKey = (code) => `impostor:${code}`;

// Track server time offset for timer synchronization
let serverTimeOffset = 0;

export const getServerTime = () => Date.now() + serverTimeOffset;

export const loadGame = async (roomCode) => {
  try {
    const beforeFetch = Date.now();
    const result = await window.storage.get(getGameKey(roomCode), true);
    const afterFetch = Date.now();

    if (!result) return null;

    const game = JSON.parse(result.value);

    // Estimate server time offset using round-trip time
    // This helps synchronize timers across clients
    if (game.serverTimestamp) {
      const rtt = afterFetch - beforeFetch;
      const estimatedServerTime = game.serverTimestamp + (rtt / 2);
      serverTimeOffset = estimatedServerTime - afterFetch;
    }

    return game;
  } catch { return null; }
};

export const saveGame = async (game) => {
  try {
    // Add server timestamp for synchronization
    const gameWithTimestamp = {
      ...game,
      serverTimestamp: Date.now()
    };
    await window.storage.set(getGameKey(game.roomCode), JSON.stringify(gameWithTimestamp), true);
    return true;
  } catch { return false; }
};

export { serverTimeOffset };
