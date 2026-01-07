import { Button, Card } from './ui';

const RoundResultPhase = ({ game, playerId, onNextRound }) => {
  const isHost = game.hostId === playerId;
  const lastEliminated = game.lastEliminatedId;
  const eliminatedPlayer = lastEliminated ? game.players.find(p => p.id === lastEliminated) : null;
  const wasImpostor = lastEliminated ? game.impostorIds.includes(lastEliminated) : false;
  const eliminatedIds = game.eliminatedIds || [];
  const remainingImpostors = game.impostorIds.filter(id => !eliminatedIds.includes(id)).length;
  const totalImpostors = game.impostorIds.length;

  // Calculate vote tally for display
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

  // Sort players by vote count (descending)
  const alivePlayers = game.players.filter(p => !eliminatedIds.includes(p.id) || p.id === lastEliminated);
  const sortedByVotes = [...alivePlayers].sort((a, b) => (voteTally[b.id] || 0) - (voteTally[a.id] || 0));

  // Check if there was a tie
  const maxVotes = Math.max(...Object.values(voteTally), 0);
  const playersWithMaxVotes = Object.entries(voteTally).filter(([id, count]) => count === maxVotes);
  const wasTie = playersWithMaxVotes.length > 1 && maxVotes > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        <div className="text-purple-300 font-bold mb-4">Round {game.round} Result</div>

        {eliminatedPlayer ? (
          <>
            <div className="text-4xl mb-4">{wasImpostor ? '🎯' : '😱'}</div>

            <div className="text-2xl font-bold text-white mb-2">
              {eliminatedPlayer.name} was eliminated!
            </div>

            <div className={`py-4 px-6 rounded-xl mb-4 ${wasImpostor ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`text-lg font-bold ${wasImpostor ? 'text-green-300' : 'text-red-300'}`}>
                {wasImpostor ? '✓ They were an IMPOSTOR!' : '✗ They were INNOCENT!'}
              </div>
            </div>

            {wasTie && (
              <div className="text-yellow-400 text-sm mb-4">
                ⚠️ There was a tie! Random selection was made.
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">🤷</div>

            <div className="text-2xl font-bold text-white mb-2">
              No one was eliminated!
            </div>

            <div className="py-4 px-6 rounded-xl mb-4 bg-yellow-500/20">
              <div className="text-lg font-bold text-yellow-300">
                {Object.keys(voteTally).length === 0 ? 'No votes were cast' : 'Not enough votes to eliminate anyone'}
              </div>
            </div>
          </>
        )}

        {/* Vote Results */}
        <div className="mb-6 p-4 rounded-xl bg-white/5">
          <div className="text-white/60 text-sm mb-3">Vote Results:</div>
          <div className="space-y-2">
            {sortedByVotes.map((p) => {
              const votes = voteTally[p.id] || 0;
              const isElim = p.id === lastEliminated;
              return (
                <div
                  key={p.id}
                  className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                    isElim ? 'bg-red-500/30 border border-red-500/50' : 'bg-white/10'
                  }`}
                >
                  <span className={`text-white ${isElim ? 'line-through' : ''}`}>
                    {p.name} {isElim && '☠️'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    votes > 0 ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/40'
                  }`}>
                    {votes} vote{votes !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-white/60 mb-6">
          {remainingImpostors > 0 ? (
            <>Impostors remaining: <span className="text-red-400 font-bold">{remainingImpostors}/{totalImpostors}</span></>
          ) : (
            <span className="text-green-400">All impostors found!</span>
          )}
        </div>

        {isHost && (
          <Button onClick={onNextRound} className="w-full">
            {remainingImpostors > 0 ? 'Start Next Round' : 'See Final Results'}
          </Button>
        )}

        {!isHost && (
          <div className="text-white/60">Waiting for host to continue...</div>
        )}
      </Card>
    </div>
  );
};

export default RoundResultPhase;
