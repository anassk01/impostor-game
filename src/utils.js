// ============================================
// UTILITY FUNCTIONS
// ============================================
export const generateId = () => Math.random().toString(36).substring(2, 10);

export const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();

export const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper to check win conditions
export const checkWinCondition = (players, impostorIds, eliminatedIds = []) => {
  const alivePlayers = players.filter(p => !eliminatedIds.includes(p.id));
  const aliveImpostors = alivePlayers.filter(p => impostorIds.includes(p.id));
  const aliveCrew = alivePlayers.filter(p => !impostorIds.includes(p.id));

  if (aliveImpostors.length === 0) return 'crew'; // All impostors eliminated
  if (aliveImpostors.length >= aliveCrew.length) return 'impostor'; // Impostors outnumber or equal crew
  return null; // Game continues
};
