import { useState, useEffect, useRef } from 'react';
import { PHASES, WORD_CATEGORIES } from './constants';
import { generateId, generateRoomCode, pickRandom, shuffleArray, checkWinCondition } from './utils';
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
    const stored = sessionStorage.getItem('impostorPlayerId');
    return stored || generateId();
  });
  const [error, setError] = useState('');
  const pollingRef = useRef(null);
  const gameRef = useRef(null);

  // Keep gameRef in sync
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    sessionStorage.setItem('impostorPlayerId', playerId);
  }, [playerId]);

  // Polling with ref to avoid stale closure
  useEffect(() => {
    if (!game?.roomCode) return;

    const roomCode = game.roomCode;

    const poll = async () => {
      const latest = await loadGame(roomCode);
      if (!latest) return;

      // Check if current player was kicked (not in players list anymore)
      const stillInGame = latest.players.some(p => p.id === playerId);
      if (!stillInGame) {
        // Player was kicked - redirect to home
        setGame(null);
        setPhase(PHASES.HOME);
        window.location.hash = '';
        setError('You were removed from the game');
        return;
      }

      const currentGame = gameRef.current;
      if (JSON.stringify(latest) !== JSON.stringify(currentGame)) {
        setGame(latest);
        setPhase(latest.phase);
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
      winner: null,
      createdAt: Date.now()
    };

    const saved = await saveGame(newGame);
    if (saved) {
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
    if (existing.players.find((p) => p.id === playerId)) {
      setGame(existing);
      setPhase(existing.phase);
      return;
    }
    if (existing.players.length >= 20) {
      setError('Game is full');
      return;
    }

    existing.players.push({ id: playerId, name: name.trim() });
    await saveGame(existing);
    setGame(existing);
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
      // Remove from impostorIds if they were an impostor
      impostorIds: (latestGame.impostorIds || []).filter(id => id !== kickedPlayerId),
      // Remove from eliminatedIds if they were eliminated
      eliminatedIds: (latestGame.eliminatedIds || []).filter(id => id !== kickedPlayerId),
      // Remove their clues
      clues: (latestGame.clues || []).filter(c => c.playerId !== kickedPlayerId),
      // Remove their votes
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
      )
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
          setGame(finalUpdate);
          setPhase(finalUpdate.phase);
          return;
        }
      }
    }

    await saveGame(updated);
    setGame(updated);
    setPhase(updated.phase);
  };

  const startGame = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) {
      setError('Failed to load game');
      return;
    }

    const impostorCount = Math.min(latestGame.settings.numImpostors, Math.floor(latestGame.players.length / 3));
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
      winner: null
    };
    await saveGame(updated);
    setGame(updated);
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

    const updated = { ...latestGame };
    updated.clues.push({ playerId: currentPlayer.id, clue: '(skipped)' });
    updated.currentClueIndex = updated.clues.length;
    updated.turnStartTime = Date.now();

    // Check if all alive players have submitted
    if (updated.clues.length >= alivePlayers.length) {
      updated.phase = PHASES.DISCUSSION;
      updated.phaseStartTime = Date.now();
    }

    await saveGame(updated);
    setGame(updated);
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
      setGame(latestGame);
      setPhase(latestGame.phase);
      return;
    }

    const eliminatedIds = latestGame.eliminatedIds || [];
    const alivePlayers = latestGame.players.filter(p => !eliminatedIds.includes(p.id));

    // Validate it's actually this player's turn
    const currentPlayer = alivePlayers.find(p => !latestGame.clues.find(c => c.playerId === p.id));
    if (!currentPlayer || currentPlayer.id !== playerId) {
      // Not this player's turn
      setGame(latestGame);
      setPhase(latestGame.phase);
      return;
    }

    // Check if player is eliminated
    if (eliminatedIds.includes(playerId)) {
      setGame(latestGame);
      setPhase(latestGame.phase);
      return;
    }

    const updated = { ...latestGame };
    updated.clues.push({ playerId, clue: clue.trim() });
    updated.currentClueIndex = updated.clues.length;
    updated.turnStartTime = Date.now();

    // Check if all alive players have submitted
    if (updated.clues.length >= alivePlayers.length) {
      updated.phase = PHASES.DISCUSSION;
      updated.phaseStartTime = Date.now();
    }

    await saveGame(updated);
    setGame(updated);
    setPhase(updated.phase);
  };

  const endDiscussion = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame || latestGame.phase !== PHASES.DISCUSSION) return;

    const updated = { ...latestGame, phase: PHASES.VOTING, phaseStartTime: Date.now() };
    await saveGame(updated);
    setGame(updated);
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
      .map(([id]) => id);

    // In case of tie, pick randomly among tied players
    const eliminatedId = playersWithMaxVotes.length > 0
      ? playersWithMaxVotes[Math.floor(Math.random() * playersWithMaxVotes.length)]
      : null;

    const updated = { ...gameState };

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
    setGame(updated);
    setPhase(updated.phase);
  };

  const vote = async (votedForIds) => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) {
      setError('Failed to submit vote');
      return;
    }

    const eliminatedIds = latestGame.eliminatedIds || [];
    if (eliminatedIds.includes(playerId)) {
      // Eliminated players can't vote
      setGame(latestGame);
      setPhase(latestGame.phase);
      return;
    }

    const votesPerPlayer = latestGame.settings.votesPerPlayer || 1;
    const existingVotes = latestGame.votes[playerId] || [];

    // Check if already voted the required number
    if (existingVotes.length >= votesPerPlayer) {
      setGame(latestGame);
      setPhase(latestGame.phase);
      return;
    }

    // Validate votes: filter out any votes for eliminated players or self
    const validVotes = (Array.isArray(votedForIds) ? votedForIds : [votedForIds])
      .filter(id => id !== playerId && !eliminatedIds.includes(id));

    if (validVotes.length === 0) {
      setGame(latestGame);
      setPhase(latestGame.phase);
      return;
    }

    const updated = { ...latestGame };
    updated.votes[playerId] = validVotes;

    // Check if all alive players have voted their full allotment
    const alivePlayers = updated.players.filter(p => !(updated.eliminatedIds || []).includes(p.id));
    const allVoted = alivePlayers.every(p => {
      const pVotes = updated.votes[p.id] || [];
      return pVotes.length >= votesPerPlayer;
    });

    if (allVoted) {
      const finalUpdate = processVoteResult(updated);
      await saveGame(finalUpdate);
      setGame(finalUpdate);
      setPhase(finalUpdate.phase);
    } else {
      await saveGame(updated);
      setGame(updated);
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

      const updated = { ...latestGame, winner, phase: PHASES.REVEAL, clueHistory };
      await saveGame(updated);
      setGame(updated);
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
      votes: {}
    };

    await saveGame(updated);
    setGame(updated);
    setPhase(PHASES.CLUE);
  };

  const playAgain = async () => {
    const latestGame = await loadGame(game.roomCode);
    if (!latestGame) {
      setError('Failed to load game');
      return;
    }

    const impostorCount = Math.min(latestGame.settings.numImpostors, Math.floor(latestGame.players.length / 3));
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
      winner: null
    };
    await saveGame(updated);
    setGame(updated);
    setPhase(PHASES.CLUE);
  };

  const backToLobby = async () => {
    const updated = {
      ...game,
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
      winner: null
    };
    await saveGame(updated);
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
