import { useState, useEffect } from 'react';
import { Button, Card, Timer } from './ui';

const VotingPhase = ({ game, playerId, onVote, onForceEndVoting, onKickPlayer }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [hasTriggeredEnd, setHasTriggeredEnd] = useState(false);
  const eliminatedIds = game.eliminatedIds || [];
  const isEliminated = eliminatedIds.includes(playerId);
  const alivePlayers = game.players.filter(p => !eliminatedIds.includes(p.id));
  const votesPerPlayer = game.settings.votesPerPlayer || 1;
  const myVotes = game.votes[playerId] || [];
  const hasVoted = myVotes.length >= votesPerPlayer;
  // Count how many players have completed all their votes
  const playersWhoVoted = Object.entries(game.votes).filter(([pid, votes]) => {
    const requiredVotes = votesPerPlayer;
    return Array.isArray(votes) ? votes.length >= requiredVotes : false;
  }).length;
  const totalVoters = alivePlayers.length; // Only alive players vote
  const isHost = game.hostId === playerId;
  const votingTime = game.settings.votingTime || 45;

  // Calculate live vote tally
  const voteTally = {};
  Object.values(game.votes).forEach((v) => {
    if (Array.isArray(v)) {
      v.forEach(votedId => {
        voteTally[votedId] = (voteTally[votedId] || 0) + 1;
      });
    } else if (v) {
      voteTally[v] = (voteTally[v] || 0) + 1;
    }
  });

  const getVoteCount = (playerId) => voteTally[playerId] || 0;

  const toggleSelection = (id) => {
    if (id === playerId) return; // Can't vote for yourself
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else if (prev.length < votesPerPlayer) {
        return [...prev, id];
      }
      return prev;
    });
  };

  // Synced timer based on phaseStartTime
  const calculateTimeLeft = () => {
    if (!game.phaseStartTime) return votingTime;
    const elapsed = Math.floor((Date.now() - game.phaseStartTime) / 1000);
    return Math.max(0, votingTime - elapsed);
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      // Force end if time is up (even with 0 votes - will result in no elimination)
      // Only trigger once to prevent multiple calls
      if (remaining <= 0 && isHost && !hasTriggeredEnd) {
        setHasTriggeredEnd(true);
        onForceEndVoting();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [game.phaseStartTime, isHost, hasTriggeredEnd]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        {game.round > 1 && (
          <div className="mb-4 text-purple-300 font-bold">Round {game.round}</div>
        )}
        {isEliminated && (
          <div className="mb-4 py-2 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300">
            You were eliminated. Watch the vote.
          </div>
        )}
        <div className="mb-4">
          <Timer seconds={timeLeft} label="Voting Time" />
        </div>
        <div className="text-2xl font-bold text-white mb-2">🗳️ Vote!</div>
        <p className="text-white/60 mb-6">
          {votesPerPlayer > 1
            ? `Select ${votesPerPlayer} players you think are impostors`
            : 'Who is the impostor?'}
        </p>
        <div className="text-white/40 text-sm mb-4">
          Players voted: {playersWhoVoted}/{totalVoters}
          {votesPerPlayer > 1 && <span className="ml-2">({votesPerPlayer} votes each)</span>}
        </div>

        {!hasVoted && !isEliminated ? (
          <div className="space-y-3 mb-6">
            {votesPerPlayer > 1 && (
              <div className="text-purple-300 text-sm mb-2">
                Selected: {selectedIds.length}/{votesPerPlayer}
              </div>
            )}
            {alivePlayers.map((p) => {
              const voteCount = getVoteCount(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSelection(p.id)}
                  disabled={p.id === playerId}
                  className={`w-full py-3 px-4 rounded-xl border transition flex justify-between items-center ${
                    p.id === playerId
                      ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                      : selectedIds.includes(p.id)
                        ? 'bg-purple-500/30 border-purple-500 text-white'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <span>
                    {p.name} {p.id === playerId ? '(You)' : ''}
                    {selectedIds.includes(p.id) && ' ✓'}
                  </span>
                  {voteCount > 0 && (
                    <span className="bg-red-500/30 text-red-300 px-2 py-1 rounded-full text-xs font-bold">
                      {voteCount} vote{voteCount > 1 ? 's' : ''}
                    </span>
                  )}
                </button>
              );
            })}
            <Button
              onClick={() => onVote(selectedIds)}
              disabled={selectedIds.length !== votesPerPlayer}
              className="w-full mt-4"
            >
              {selectedIds.length === votesPerPlayer
                ? `Confirm Vote${votesPerPlayer > 1 ? 's' : ''}`
                : `Select ${votesPerPlayer - selectedIds.length} more`}
            </Button>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-green-400 text-lg">✓ Vote{votesPerPlayer > 1 ? 's' : ''} submitted!</div>
            <div className="text-white/60 mt-2">Waiting for others...</div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-white/5">
          <div className="text-white/60 text-sm mb-3">Clues Recap:</div>
          <div className="flex flex-wrap justify-center gap-2">
            {game.clues.map((c) => {
              const p = game.players.find((pl) => pl.id === c.playerId);
              return (
                <div key={c.playerId} className="px-2 py-1 rounded bg-white/10 text-sm">
                  <span className="text-white/60">{p?.name}:</span>
                  <span className="text-white ml-1">{c.clue}</span>
                </div>
              );
            })}
          </div>
        </div>

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

export default VotingPhase;
