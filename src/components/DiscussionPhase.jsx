import { useState, useEffect } from 'react';
import { Button, Card, Timer } from './ui';

const DiscussionPhase = ({ game, playerId, onEndDiscussion, onKickPlayer }) => {
  const isHost = game.hostId === playerId;
  const isImpostor = game.impostorIds.includes(playerId);
  const discussionTime = game.settings.discussionTime || 60;
  const [hasTriggeredEnd, setHasTriggeredEnd] = useState(false);

  // Synced timer based on phaseStartTime
  const calculateTimeLeft = () => {
    if (!game.phaseStartTime) return discussionTime;
    const elapsed = Math.floor((Date.now() - game.phaseStartTime) / 1000);
    return Math.max(0, discussionTime - elapsed);
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      // Only trigger once to prevent multiple calls
      if (remaining <= 0 && isHost && !hasTriggeredEnd) {
        setHasTriggeredEnd(true);
        onEndDiscussion();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [game.phaseStartTime, isHost, hasTriggeredEnd]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        <div className="mb-6">
          <Timer seconds={timeLeft} label="Discussion Time" />
        </div>

        <div className="text-2xl font-bold text-white mb-2">🗣️ Discuss!</div>
        <p className="text-white/60 mb-6">Who seems suspicious? Talk it out!</p>

        {isImpostor && (
          <div className="py-3 px-4 rounded-xl bg-red-500/20 border border-red-500/30 mb-6">
            <div className="text-red-400 text-sm">🕵️ Remember: You're the impostor! Blend in!</div>
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl bg-white/5">
          <div className="text-white/60 text-sm mb-3">All Clues:</div>
          <div className="space-y-2">
            {game.clues.map((c) => {
              const p = game.players.find((pl) => pl.id === c.playerId);
              return (
                <div key={c.playerId} className="flex justify-between items-center px-3 py-2 rounded-lg bg-white/10">
                  <span className="text-white">{p?.name}</span>
                  <span className="text-purple-300 font-semibold">"{c.clue}"</span>
                </div>
              );
            })}
          </div>
        </div>

        {isHost && (
          <Button onClick={onEndDiscussion} className="w-full">End Discussion → Vote</Button>
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

export default DiscussionPhase;
