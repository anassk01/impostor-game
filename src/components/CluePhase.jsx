import { useState, useEffect } from 'react';
import { Button, Input, Card, Timer } from './ui';
import { CATEGORY_NAMES } from '../constants';
import { getServerTime } from '../gameStorage';

const CluePhase = ({ game, playerId, onSubmitClue, onSkipTurn, onKickPlayer }) => {
  const [clue, setClue] = useState('');
  const isImpostor = game.impostorIds.includes(playerId);
  const eliminatedIds = game.eliminatedIds || [];
  const isEliminated = eliminatedIds.includes(playerId);
  const alivePlayers = game.players.filter(p => !eliminatedIds.includes(p.id));
  const myClue = game.clues.find((c) => c.playerId === playerId);
  // Find next alive player who hasn't submitted
  const currentPlayer = alivePlayers.find(p => !game.clues.find(c => c.playerId === p.id));
  const isMyTurn = currentPlayer?.id === playerId && !isEliminated;
  const clueTime = game.settings.clueTime || 30;

  // Synced timer based on turnStartTime using server time
  const calculateTimeLeft = (allowNegative = false) => {
    if (!game.turnStartTime) return clueTime;
    const serverNow = getServerTime();
    const elapsed = Math.floor((serverNow - game.turnStartTime) / 1000);
    const remaining = clueTime - elapsed;
    return allowNegative ? remaining : Math.max(0, remaining);
  };

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(false));

  const isHost = game.hostId === playerId;

  useEffect(() => {
    const timer = setInterval(() => {
      const displayTime = calculateTimeLeft(false);
      const actualTime = calculateTimeLeft(true); // Allow negative for grace period check
      setTimeLeft(displayTime);
      // Trigger skip if:
      // 1. It's YOUR turn and timer expired (immediate)
      // 2. You're the HOST and timer expired for 2+ seconds (fallback for AFK players)
      if (actualTime <= 0 && currentPlayer) {
        const hasPlayerClue = game.clues.find(c => c.playerId === currentPlayer.id);
        if (!hasPlayerClue) {
          if (isMyTurn) {
            // Current player skips immediately
            onSkipTurn(currentPlayer.id);
          } else if (isHost && actualTime <= -2) {
            // Host skips after 2 second grace period (fallback)
            onSkipTurn(currentPlayer.id);
          }
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [game.turnStartTime, isMyTurn, currentPlayer?.id, playerId, isHost, game.clues]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        {game.round > 1 && (
          <div className="mb-4 text-purple-300 font-bold">Round {game.round}</div>
        )}
        {isEliminated && (
          <div className="mb-4 py-2 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300">
            You were eliminated. Watch the remaining players.
          </div>
        )}
        <div className="mb-4">
          <Timer seconds={timeLeft} label={isMyTurn ? "Your Time" : `${currentPlayer?.name}'s Time`} />
        </div>
        <div className="mb-6">
          <div className="text-white/60 text-sm mb-2">Category: {CATEGORY_NAMES[game.settings.language || 'en'][game.settings.category]}</div>
          {isImpostor ? (
            <div className="py-6 px-4 rounded-xl bg-red-500/20 border border-red-500/30">
              <div className="text-red-400 font-bold text-lg mb-1">🕵️ YOU ARE THE IMPOSTOR</div>
              <div className="text-white/60 text-sm">Blend in! You don't know the word.</div>
            </div>
          ) : (
            <div className="py-6 px-4 rounded-xl bg-green-500/20 border border-green-500/30">
              <div className="text-green-400 text-sm mb-1">The secret word is:</div>
              <div className="text-4xl font-bold text-white">{game.secretWord}</div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="text-white/60 text-sm mb-2">Turn Order</div>
          <div className="flex flex-wrap justify-center gap-2">
            {game.players.map((p) => {
              const hasClue = game.clues.find((c) => c.playerId === p.id);
              const isCurrent = currentPlayer?.id === p.id;
              const isPlayerEliminated = eliminatedIds.includes(p.id);
              return (
                <div key={p.id} className={`px-3 py-1 rounded-full text-sm ${
                  isPlayerEliminated ? 'bg-red-500/30 text-red-300 line-through' :
                  isCurrent ? 'bg-purple-500 text-white' :
                  hasClue ? 'bg-green-500/30 text-green-300' :
                  'bg-white/10 text-white/50'
                }`}>
                  {p.name}{p.id === playerId ? ' (You)' : ''}{isPlayerEliminated ? ' ☠️' : ''}
                </div>
              );
            })}
          </div>
        </div>

        {isMyTurn && !myClue ? (
          <div className="space-y-4">
            <div className="text-xl text-white font-semibold">Your turn! Give a one-word clue:</div>
            <Input value={clue} onChange={setClue} placeholder="Enter one word..." maxLength={20} className="text-center text-xl" />
            <Button onClick={() => { onSubmitClue(clue); setClue(''); }} disabled={!clue.trim() || clue.includes(' ')} className="w-full">Submit Clue</Button>
          </div>
        ) : myClue ? (
          <div className="text-white/60">You said: <span className="text-white font-semibold">"{myClue.clue}"</span></div>
        ) : (
          <div className="text-xl text-white">Waiting for <span className="text-purple-400">{currentPlayer?.name}</span>...</div>
        )}

        {game.clues.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-white/60 text-sm mb-3">Clues given:</div>
            <div className="flex flex-wrap justify-center gap-2">
              {game.clues.map((c) => {
                const p = game.players.find((pl) => pl.id === c.playerId);
                return (
                  <div key={c.playerId} className="px-3 py-2 rounded-lg bg-white/10">
                    <span className="text-white/60 text-sm">{p?.name}:</span>
                    <span className="text-white ml-2 font-semibold">{c.clue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isHost && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-white/60 text-sm mb-3">Kick Player</div>
            <div className="flex flex-wrap justify-center gap-2">
              {game.players.filter(p => p.id !== playerId).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onKickPlayer(p.id)}
                  className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30 transition"
                >
                  Kick {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CluePhase;
