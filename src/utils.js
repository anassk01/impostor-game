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

// Seeded random for deterministic results (used for tie-breaking)
export const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Deterministic shuffle using a seed
export const seededShuffle = (arr, seed) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
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

// Sanitize game state for a specific player (hide secret word from impostors)
export const sanitizeGameForPlayer = (game, playerId) => {
  if (!game) return null;

  const isImpostor = game.impostorIds?.includes(playerId);

  // If player is an impostor, hide the secret word
  if (isImpostor) {
    return {
      ...game,
      secretWord: '???', // Hide from impostors
    };
  }

  return game;
};

// Validate clue content
export const validateClue = (clue, secretWord) => {
  if (!clue || typeof clue !== 'string') return { valid: false, error: 'Invalid clue' };

  const trimmed = clue.trim();

  if (trimmed.length === 0) return { valid: false, error: 'Clue cannot be empty' };
  if (trimmed.length > 20) return { valid: false, error: 'Clue too long (max 20 characters)' };
  if (trimmed.includes(' ')) return { valid: false, error: 'Clue must be one word' };

  // Check if clue is too similar to secret word (case insensitive)
  if (secretWord && trimmed.toLowerCase() === secretWord.toLowerCase()) {
    return { valid: false, error: 'Clue cannot be the secret word' };
  }

  return { valid: true, clue: trimmed };
};
