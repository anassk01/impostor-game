import { Button, Card } from './ui';

const RoundResultPhase = ({ game, playerId, onNextRound }) => {
  const isHost = game.hostId === playerId;
  const lastEliminated = game.lastEliminatedId;
  const eliminatedPlayer = lastEliminated ? game.players.find(p => p.id === lastEliminated) : null;
  const wasImpostor = lastEliminated ? game.impostorIds.includes(lastEliminated) : false;
  const eliminatedIds = game.eliminatedIds || [];
  const remainingImpostors = game.impostorIds.filter(id => !eliminatedIds.includes(id)).length;
  const totalImpostors = game.impostorIds.length;

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

            <div className={`py-4 px-6 rounded-xl mb-6 ${wasImpostor ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`text-lg font-bold ${wasImpostor ? 'text-green-300' : 'text-red-300'}`}>
                {wasImpostor ? '✓ They were an IMPOSTOR!' : '✗ They were INNOCENT!'}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">🤷</div>

            <div className="text-2xl font-bold text-white mb-2">
              No one was eliminated!
            </div>

            <div className="py-4 px-6 rounded-xl mb-6 bg-yellow-500/20">
              <div className="text-lg font-bold text-yellow-300">
                Not enough votes to eliminate anyone
              </div>
            </div>
          </>
        )}

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
