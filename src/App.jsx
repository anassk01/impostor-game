import { useState, useEffect, useRef } from 'react';
import { PHASES, WORD_CATEGORIES } from './constants';
import { generateId, generateRoomCode, pickRandom, shuffleArray, checkWinCondition, sanitizeGameForPlayer, validateClue, seededRandom } from './utils';
import { loadGame, saveGame } from './gameStorage';

// Import components
import HomeScreen from './components/HomeScreen';
import LobbyScreen from './components/LobbyScreen';
import CluePhase from './components/CluePhase';
import DiscussionPhase from './components/DiscussionPhase';
import VotingPhase from './components/VotingPhase';
import RoundResultPhase from './components/RoundResultPhase';
import RevealPhase from './components/RevealPhase';

// ============================================
// MAIN GAME COMPONENT
// ============================================
export default function ImpostorGame() {
  const [phase, setPhase] = useState(PHASES.HOME);
  const [game, setGame] = useState(null);
  const [playerId, setPlayerId] = useState(() => {
    // Use localStorage for persistence across tabs/sessions
    const stored = localStorage.getItem('impostorPlayerId');
    return stored || generateId();
  });
  const [error, setError] = useState('');
  const pollingRef = useRef(null);
  const gameRef = useRef(null);
  const rawGameRef = useRef(null); // Store unsanitized game for internal operations

  // Keep gameRef in sync
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    localStorage.setItem('impostorPlayerId', playerId);
  }, [playerId]);

  // Polling with ref to avoid stale closure
  useEffect(() => {
    if (!game?.roomCode) return;

    const roomCode = game.roomCode;

    const poll = async () => {
      const latest = await loadGame(roomCode);
      if (!latest) return;

      // Check if current player was kicked
      const stillInGame = latest.players.some(p => p.id === playerId);
      const wasKicked = latest.kickedPlayerIds?.includes(playerId);

      if (!stillInGame || wasKicked) {
        // Player was kicked - redirect to home
        setGame(null);
        setPhase(PHASES.HOME);
        window.location.hash = '';
        setError('You were removed from the game');
        return;
      }

      // Host migration: if host left, assign new host to first remaining player
      let updatedGame = latest;
      const hostStillInGame = latest.players.some(p => p.id === latest.hostId);
      if (!hostStillInGame && latest.players.length > 0) {
        updatedGame = { ...latest, hostId: latest.players[0].id };
        await saveGame(updatedGame);
      }

      // Store raw game for internal operations
      rawGameRef.current = updatedGame;

      // Sanitize game state for this player (hide secret word from impostors)
      const sanitizedGame = sanitizeGameForPlayer(updatedGame, playerId);

      const currentGame = gameRef.current;
      if (JSON.stringify(sanitizedGame) !== JSON.stringify(currentGame)) {
        setGame(sanitizedGame);
        setPhase(sanitizedGame.phase);
      }
    };

    pollingRef.current = setInterval(poll, 1000);
    return () => clearInterval(pollingRef.current);
  }, [game?.roomCode, playerId]);

  const createGame = async (name) => {
    const roomCode = generateRoomCode();
    const newGame = {
      roomCode,
      hostId: playerId,
      players: [{ id: playerId, name: name.trim() }],
      phase: PHASES.LOBBY,
      settings: {
        category: 'food',
        numImpostors: 1,
        language: 'en',
        clueTime: 30,
        discussionTime: 60,
        votingTime: 45,
        votesPerPlayer: 1
      },
      secretWord: '',
      impostorIds: [],
      clues: [],
      currentClueIndex: 0,
      turnStartTime: null,
      phaseStartTime: null,
      votes: {},
      eliminatedId: null,
      eliminatedIds: [],
      kickedPlayerIds: [], // Track kicked players to prevent rejoin
      winner: null,
      version: 1, // Optimistic locking version
      createdAt: Date.now()
    };

    const saved = await saveGame(newGame);
    if (saved) {
      rawGameRef.current = newGame;
      setGame(newGame);
      setPhase(PHASES.LOBBY);
      window.location.hash = roomCode;
    } else {
      setError('Failed to create game');
    }
  };

  const joinGame = async (name, code) => {
    const existing = await loadGame(code);
    if (!existing) {
      setError('Game not found');
      return;
    }
    if (existing.phase !== PHASES.LOBBY) {
      setError('Game already in progress');
      return;
    }
    // Check if player was kicked from this game
    if (existing.kickedPlayerIds?.includes(playerId)) {
      setError('You were kicked from this game');
      return;
    }
    if (existing.players.find((p) => p.id === playerId)) {
      rawGameRef.current = existing;
      setGame(sanitizeGameForPlayer(existing, playerId));
      setPhase(existing.phase);
      return;
    }
    if (existing.players.length >= 20) {
      setError('Game is full');
      return;
    }

    const updated = {
      ...existing,
      players: [...existing.players, { id: playerId, name: name.trim() }],
      version: (existing.version || 0) + 1
    };
    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(PHASES.LOBBY);
    window.location.hash = code;
  };

  const updateSettings = async (updates) => {
    const updated = { ...game, settings: { ...game.settings, ...updates } };
    await saveGame(updated);
    setGame(updated);
  };

  const kickPlayer = async (kickedPlayerId) => {
    if (game.hostId !== playerId) return;
    if (kickedPlayerId === game.hostId) return;

    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) return;

    const updated = {
      ...latestGame,
      players: latestGame.players.filter(p => p.id !== kickedPlayerId),
      // Track kicked players to prevent rejoin
      kickedPlayerIds: [...(latestGame.kickedPlayerIds || []), kickedPlayerId],
      // Remove from impostorIds if they were an impostor
      impostorIds: (latestGame.impostorIds || []).filter(id => id !== kickedPlayerId),
      // Remove from eliminatedIds if they were eliminated
      eliminatedIds: (latestGame.eliminatedIds || []).filter(id => id !== kickedPlayerId),
      // Remove their clues
      clues: (latestGame.clues || []).filter(c => c.playerId !== kickedPlayerId),
      // Remove their votes and votes for them
      votes: Object.fromEntries(
        Object.entries(latestGame.votes || {})
          .filter(([voterId]) => voterId !== kickedPlayerId)
          .map(([voterId, votedFor]) => [
            voterId,
            Array.isArray(votedFor)
              ? votedFor.filter(id => id !== kickedPlayerId)
              : votedFor === kickedPlayerId ? null : votedFor
          ])
          .filter(([, v]) => v !== null && (Array.isArray(v) ? v.length > 0 : true))
      ),
      version: (latestGame.version || 0) + 1
    };

    // Check win condition after kick (during game phases)
    if (latestGame.phase !== PHASES.LOBBY && latestGame.phase !== PHASES.HOME) {
      const winner = checkWinCondition(updated.players, updated.impostorIds, updated.eliminatedIds);
      if (winner) {
        updated.winner = winner;
        updated.phase = PHASES.REVEAL;
      } else if (latestGame.phase === PHASES.CLUE) {
        // Check if all remaining alive players have submitted clues
        const alivePlayers = updated.players.filter(p => !(updated.eliminatedIds || []).includes(p.id));
        const allCluesSubmitted = alivePlayers.every(p => updated.clues.find(c => c.playerId === p.id));
        if (allCluesSubmitted && alivePlayers.length > 0) {
          updated.phase = PHASES.DISCUSSION;
          updated.phaseStartTime = Date.now();
        }
      } else if (latestGame.phase === PHASES.VOTING) {
        // Check if all remaining alive players have voted
        const alivePlayers = updated.players.filter(p => !(updated.eliminatedIds || []).includes(p.id));
        const votesPerPlayer = updated.settings.votesPerPlayer || 1;
        const allVoted = alivePlayers.every(p => {
          const pVotes = updated.votes[p.id] || [];
          return pVotes.length >= votesPerPlayer;
        });
        if (allVoted && Object.keys(updated.votes).length > 0) {
          const finalUpdate = processVoteResult(updated);
          await saveGame(finalUpdate);
          rawGameRef.current = finalUpdate;
          setGame(sanitizeGameForPlayer(finalUpdate, playerId));
          setPhase(finalUpdate.phase);
          return;
        }
      }
    }

    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(updated.phase);
  };

  const startGame = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) {
      setError('Failed to load game');
      return;
    }

    // Ensure at least 1 impostor even with 3 players
    const maxImpostors = Math.max(1, Math.floor(latestGame.players.length / 3));
    const impostorCount = Math.min(latestGame.settings.numImpostors, maxImpostors);
    const shuffledForImpostors = shuffleArray(latestGame.players);
    const impostorIds = shuffledForImpostors.slice(0, impostorCount).map((p) => p.id);

    const shuffledPlayers = shuffleArray(latestGame.players);
    const language = latestGame.settings.language || 'en';
    const secretWord = pickRandom(WORD_CATEGORIES[language][latestGame.settings.category]);

    const updated = {
      ...latestGame,
      players: shuffledPlayers,
      impostorIds,
      secretWord,
      phase: PHASES.CLUE,
      clues: [],
      currentClueIndex: 0,
      turnStartTime: Date.now(),
      votes: {},
      eliminatedIds: [],
      lastEliminatedId: null,
      round: 1,
      winner: null,
      voteSeed: Date.now(), // Seed for deterministic tie-breaking
      version: (latestGame.version || 0) + 1
    };
    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(PHASES.CLUE);
  };

  const skipTurn = async (targetPlayerId) => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame || latestGame.phase !== PHASES.CLUE) return;

    const eliminatedIds = latestGame.eliminatedIds || [];
    const alivePlayers = latestGame.players.filter(p => !eliminatedIds.includes(p.id));
    const currentPlayer = alivePlayers.find(p => !latestGame.clues.find(c => c.playerId === p.id));
    if (!currentPlayer) return;

    // Allow skip if:
    // 1. It's the current player skipping their own turn, OR
    // 2. The host is skipping (as a fallback for AFK players)
    const isHost = latestGame.hostId === playerId;
    const isCurrentPlayer = currentPlayer.id === playerId;
    const targetIsCurrentPlayer = targetPlayerId === currentPlayer.id;

    if (!targetIsCurrentPlayer) return; // Can only skip the current player's turn
    if (!isCurrentPlayer && !isHost) return; // Only current player or host can trigger skip

    // Check if this player already has a clue (prevents duplicate skip)
    if (latestGame.clues.find(c => c.playerId === currentPlayer.id)) return;

    const updated = {
      ...latestGame,
      clues: [...latestGame.clues, { playerId: currentPlayer.id, clue: '(skipped)' }],
      currentClueIndex: latestGame.clues.length + 1,
      turnStartTime: Date.now(),
      version: (latestGame.version || 0) + 1
    };

    // Check if all alive players have submitted
    if (updated.clues.length >= alivePlayers.length) {
      updated.phase = PHASES.DISCUSSION;
      updated.phaseStartTime = Date.now();
    }

    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(updated.phase);
  };

  const submitClue = async (clue) => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame || latestGame.phase !== PHASES.CLUE) {
      setError('Failed to submit clue');
      return;
    }

    // Check if player already submitted
    if (latestGame.clues.find(c => c.playerId === playerId)) {
      rawGameRef.current = latestGame;
      setGame(sanitizeGameForPlayer(latestGame, playerId));
      setPhase(latestGame.phase);
      return;
    }

    const eliminatedIds = latestGame.eliminatedIds || [];
    const alivePlayers = latestGame.players.filter(p => !eliminatedIds.includes(p.id));

    // Validate it's actually this player's turn
    const currentPlayer = alivePlayers.find(p => !latestGame.clues.find(c => c.playerId === p.id));
    if (!currentPlayer || currentPlayer.id !== playerId) {
      // Not this player's turn
      rawGameRef.current = latestGame;
      setGame(sanitizeGameForPlayer(latestGame, playerId));
      setPhase(latestGame.phase);
      return;
    }

    // Check if player is eliminated
    if (eliminatedIds.includes(playerId)) {
      rawGameRef.current = latestGame;
      setGame(sanitizeGameForPlayer(latestGame, playerId));
      setPhase(latestGame.phase);
      return;
    }

    // Validate clue content (non-impostors can't submit the secret word)
    const isImpostor = latestGame.impostorIds.includes(playerId);
    const validation = validateClue(clue, isImpostor ? null : latestGame.secretWord);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const updated = {
      ...latestGame,
      clues: [...latestGame.clues, { playerId, clue: validation.clue }],
      currentClueIndex: latestGame.clues.length + 1,
      turnStartTime: Date.now(),
      version: (latestGame.version || 0) + 1
    };

    // Check if all alive players have submitted
    if (updated.clues.length >= alivePlayers.length) {
      updated.phase = PHASES.DISCUSSION;
      updated.phaseStartTime = Date.now();
    }

    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(updated.phase);
  };

  const endDiscussion = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame || latestGame.phase !== PHASES.DISCUSSION) return;

    const updated = {
      ...latestGame,
      phase: PHASES.VOTING,
      phaseStartTime: Date.now(),
      voteSeed: Date.now(), // New seed for this voting round
      version: (latestGame.version || 0) + 1
    };
    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(PHASES.VOTING);
  };

  const processVoteResult = (gameState) => {
    const votes = gameState.votes;
    const tally = {};

    // Handle both old format (single vote) and new format (array of votes)
    Object.values(votes).forEach((v) => {
      if (Array.isArray(v)) {
        // New format: array of voted player IDs
        v.forEach(votedId => {
          tally[votedId] = (tally[votedId] || 0) + 1;
        });
      } else if (v) {
        // Old format: single vote (for backwards compatibility)
        tally[v] = (tally[v] || 0) + 1;
      }
    });

    // Find the player(s) with the most votes
    const maxVotes = Math.max(...Object.values(tally), 0);
    const playersWithMaxVotes = Object.entries(tally)
      .filter(([id, count]) => count === maxVotes)
      .map(([id]) => id)
      .sort(); // Sort for determinism

    // Deterministic tie-breaking using voteSeed
    let eliminatedId = null;
    if (playersWithMaxVotes.length > 0) {
      const seed = gameState.voteSeed || gameState.createdAt || Date.now();
      const tieBreakIndex = Math.floor(seededRandom(seed + gameState.round) * playersWithMaxVotes.length);
      eliminatedId = playersWithMaxVotes[tieBreakIndex];
    }

    const updated = {
      ...gameState,
      version: (gameState.version || 0) + 1
    };

    if (eliminatedId) {
      updated.eliminatedIds = [...(updated.eliminatedIds || []), eliminatedId];
      updated.lastEliminatedId = eliminatedId;
    } else {
      // Clear lastEliminatedId when no one is eliminated
      updated.lastEliminatedId = null;
    }

    // Check win condition
    const winner = checkWinCondition(updated.players, updated.impostorIds, updated.eliminatedIds);

    if (winner) {
      updated.winner = winner;
      updated.phase = PHASES.REVEAL;
      // Save current round's clues to history for final reveal
      const currentRound = updated.round || 1;
      const clueHistory = updated.clueHistory || [];
      if (updated.clues && updated.clues.length > 0) {
        clueHistory.push({
          round: currentRound,
          word: updated.secretWord,
          clues: updated.clues
        });
        updated.clueHistory = clueHistory;
      }
    } else if (!eliminatedId) {
      // No one was eliminated (no votes), continue to next round
      updated.phase = PHASES.ROUND_RESULT;
    } else {
      // Game continues - show round result
      updated.phase = PHASES.ROUND_RESULT;
    }

    return updated;
  };

  const forceEndVoting = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame || latestGame.phase !== PHASES.VOTING) return;

    // Process vote result even with 0 votes (will result in no elimination)
    const updated = processVoteResult(latestGame);

    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(updated.phase);
  };

  const vote = async (votedForIds, skipVote = false) => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) {
      setError('Failed to submit vote');
      return;
    }

    const eliminatedIds = latestGame.eliminatedIds || [];
    if (eliminatedIds.includes(playerId)) {
      // Eliminated players can't vote
      rawGameRef.current = latestGame;
      setGame(sanitizeGameForPlayer(latestGame, playerId));
      setPhase(latestGame.phase);
      return;
    }

    const votesPerPlayer = latestGame.settings.votesPerPlayer || 1;
    const existingVotes = latestGame.votes[playerId] || [];

    // Check if already voted the required number
    if (existingVotes.length >= votesPerPlayer) {
      rawGameRef.current = latestGame;
      setGame(sanitizeGameForPlayer(latestGame, playerId));
      setPhase(latestGame.phase);
      return;
    }

    let validVotes;
    if (skipVote) {
      // Skip vote - mark as empty array (counts as having voted but no votes cast)
      validVotes = ['__skip__'];
    } else {
      // Validate votes: filter out any votes for eliminated players or self
      validVotes = (Array.isArray(votedForIds) ? votedForIds : [votedForIds])
        .filter(id => id !== playerId && !eliminatedIds.includes(id) && id !== '__skip__');

      if (validVotes.length === 0) {
        rawGameRef.current = latestGame;
        setGame(sanitizeGameForPlayer(latestGame, playerId));
        setPhase(latestGame.phase);
        return;
      }
    }

    const updated = {
      ...latestGame,
      votes: { ...latestGame.votes, [playerId]: validVotes },
      version: (latestGame.version || 0) + 1
    };

    // Check if all alive players have voted their full allotment
    const alivePlayers = updated.players.filter(p => !(updated.eliminatedIds || []).includes(p.id));
    const allVoted = alivePlayers.every(p => {
      const pVotes = updated.votes[p.id] || [];
      // Skip votes count as having voted
      return pVotes.length >= votesPerPlayer || pVotes.includes('__skip__');
    });

    if (allVoted) {
      // Filter out skip votes before processing
      const cleanedVotes = {};
      Object.entries(updated.votes).forEach(([pid, votes]) => {
        cleanedVotes[pid] = votes.filter(v => v !== '__skip__');
      });
      updated.votes = cleanedVotes;

      const finalUpdate = processVoteResult(updated);
      await saveGame(finalUpdate);
      rawGameRef.current = finalUpdate;
      setGame(sanitizeGameForPlayer(finalUpdate, playerId));
      setPhase(finalUpdate.phase);
    } else {
      await saveGame(updated);
      rawGameRef.current = updated;
      setGame(sanitizeGameForPlayer(updated, playerId));
      setPhase(updated.phase);
    }
  };

  const nextRound = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) return;

    // Check if game should end
    const winner = checkWinCondition(latestGame.players, latestGame.impostorIds, latestGame.eliminatedIds);
    if (winner) {
      // Save current round's clues to history for final reveal
      const currentRound = latestGame.round || 1;
      const clueHistory = latestGame.clueHistory || [];
      if (latestGame.clues && latestGame.clues.length > 0) {
        clueHistory.push({
          round: currentRound,
          word: latestGame.secretWord,
          clues: latestGame.clues
        });
      }

      const updated = {
        ...latestGame,
        winner,
        phase: PHASES.REVEAL,
        clueHistory,
        version: (latestGame.version || 0) + 1
      };
      await saveGame(updated);
      rawGameRef.current = updated;
      setGame(sanitizeGameForPlayer(updated, playerId));
      setPhase(PHASES.REVEAL);
      return;
    }

    // Pick a new word for the new round
    const language = latestGame.settings.language || 'en';
    const newSecretWord = pickRandom(WORD_CATEGORIES[language][latestGame.settings.category]);

    // Save current round's clues to history before starting new round
    const currentRound = latestGame.round || 1;
    const clueHistory = latestGame.clueHistory || [];
    if (latestGame.clues && latestGame.clues.length > 0) {
      clueHistory.push({
        round: currentRound,
        word: latestGame.secretWord,
        clues: latestGame.clues
      });
    }

    // Start new round with new word
    const updated = {
      ...latestGame,
      round: currentRound + 1,
      secretWord: newSecretWord,
      phase: PHASES.CLUE,
      clues: [],
      clueHistory,
      currentClueIndex: 0,
      turnStartTime: Date.now(),
      votes: {},
      voteSeed: Date.now(), // New seed for next round's voting
      version: (latestGame.version || 0) + 1
    };

    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(PHASES.CLUE);
  };

  const playAgain = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) {
      setError('Failed to load game');
      return;
    }

    // Ensure at least 1 impostor
    const maxImpostors = Math.max(1, Math.floor(latestGame.players.length / 3));
    const impostorCount = Math.min(latestGame.settings.numImpostors, maxImpostors);
    const shuffledForImpostors = shuffleArray(latestGame.players);
    const impostorIds = shuffledForImpostors.slice(0, impostorCount).map((p) => p.id);

    const shuffledPlayers = shuffleArray(latestGame.players);
    const language = latestGame.settings.language || 'en';
    const secretWord = pickRandom(WORD_CATEGORIES[language][latestGame.settings.category]);

    const updated = {
      ...latestGame,
      players: shuffledPlayers,
      impostorIds,
      secretWord,
      phase: PHASES.CLUE,
      clues: [],
      clueHistory: [],
      currentClueIndex: 0,
      turnStartTime: Date.now(),
      votes: {},
      eliminatedIds: [],
      lastEliminatedId: null,
      round: 1,
      winner: null,
      voteSeed: Date.now(),
      version: (latestGame.version || 0) + 1
    };
    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(sanitizeGameForPlayer(updated, playerId));
    setPhase(PHASES.CLUE);
  };

  const backToLobby = async () => {
    const latestGame = await loadGame(game.roomCode);
    const updated = {
      ...(latestGame || game),
      phase: PHASES.LOBBY,
      secretWord: '',
      impostorIds: [],
      clues: [],
      clueHistory: [],
      currentClueIndex: 0,
      turnStartTime: null,
      phaseStartTime: null,
      votes: {},
      eliminatedIds: [],
      lastEliminatedId: null,
      round: 1,
      winner: null,
      version: ((latestGame || game).version || 0) + 1
    };
    await saveGame(updated);
    rawGameRef.current = updated;
    setGame(updated);
    setPhase(PHASES.LOBBY);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {phase === PHASES.HOME && <HomeScreen onCreateGame={createGame} onJoinGame={joinGame} />}
      {phase === PHASES.LOBBY && game && <LobbyScreen game={game} playerId={playerId} onStartGame={startGame} onUpdateSettings={updateSettings} onKickPlayer={kickPlayer} />}
      {phase === PHASES.CLUE && game && <CluePhase game={game} playerId={playerId} onSubmitClue={submitClue} onSkipTurn={skipTurn} onKickPlayer={kickPlayer} />}
      {phase === PHASES.DISCUSSION && game && <DiscussionPhase game={game} playerId={playerId} onEndDiscussion={endDiscussion} onKickPlayer={kickPlayer} />}
      {phase === PHASES.VOTING && game && <VotingPhase game={game} playerId={playerId} onVote={vote} onForceEndVoting={forceEndVoting} onKickPlayer={kickPlayer} />}
      {phase === PHASES.ROUND_RESULT && game && <RoundResultPhase game={game} playerId={playerId} onNextRound={nextRound} />}
      {phase === PHASES.REVEAL && game && <RevealPhase game={game} playerId={playerId} onPlayAgain={playAgain} onBackToLobby={backToLobby} />}
    </div>
  );
}
