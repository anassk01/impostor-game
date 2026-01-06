import { Button, Card } from './ui';

const RevealPhase = ({ game, playerId, onPlayAgain, onBackToLobby }) => {
  const isHost = game.hostId === playerId;
  const eliminatedIds = game.eliminatedIds || [];
  const eliminatedPlayers = game.players.filter((p) => eliminatedIds.includes(p.id));
  const impostors = game.players.filter((p) => game.impostorIds.includes(p.id));
  const crewWon = game.winner === 'crew';

  // Get all clues from history (multiple rounds)
  const clueHistory = game.clueHistory || [];
  const hasMultipleRounds = clueHistory.length > 1 || (clueHistory.length === 1 && game.round > 1);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        <div className={`text-6xl mb-4 ${crewWon ? 'animate-bounce' : ''}`}>{crewWon ? '🎉' : '😈'}</div>
        <div className="text-3xl font-bold text-white mb-2">
          {crewWon ? 'Crew Wins!' : 'Impostor Wins!'}
        </div>

        <div className="mb-6">
          <div className="text-white/60 text-sm mb-2">The impostor{impostors.length > 1 ? 's were' : ' was'}:</div>
          <div className="flex flex-wrap justify-center gap-2">
            {impostors.map((p) => (
              <div key={p.id} className="px-4 py-2 rounded-full bg-red-500/30 text-red-300 font-semibold">
                🕵️ {p.name}
              </div>
            ))}
          </div>
        </div>

        {eliminatedPlayers.length > 0 && (
          <div className="mb-6">
            <div className="text-white/60 text-sm mb-2">Eliminated ({eliminatedPlayers.length}):</div>
            <div className="flex flex-wrap justify-center gap-2">
              {eliminatedPlayers.map((p) => (
                <div key={p.id} className={`px-4 py-2 rounded-full ${game.impostorIds.includes(p.id) ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
                  {p.name} {game.impostorIds.includes(p.id) ? '✓' : '✗'}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl bg-white/5">
          <div className="text-white/60 text-sm mb-3">
            {hasMultipleRounds ? 'Clues from All Rounds:' : 'Final Clues:'}
          </div>
          <div className="space-y-4">
            {clueHistory.map((roundData, idx) => (
              <div key={idx} className="space-y-2">
                {hasMultipleRounds && (
                  <div className="text-purple-400 text-sm font-semibold border-b border-white/10 pb-1 mb-2">
                    Round {roundData.round}: "{roundData.word}"
                  </div>
                )}
                {!hasMultipleRounds && (
                  <div className="py-4 px-6 rounded-xl bg-white/10 mb-4">
                    <div className="text-white/60 text-sm mb-2">The word was:</div>
                    <div className="text-3xl font-bold text-purple-300">{roundData.word}</div>
                  </div>
                )}
                {roundData.clues.map((c) => {
                  const p = game.players.find((pl) => pl.id === c.playerId);
                  const isImp = game.impostorIds.includes(c.playerId);
                  return (
                    <div key={`${idx}-${c.playerId}`} className={`flex justify-between items-center px-3 py-2 rounded-lg ${isImp ? 'bg-red-500/20' : 'bg-white/10'}`}>
                      <span className="text-white">{p?.name} {isImp && '🕵️'}</span>
                      <span className="text-purple-300">"{c.clue}"</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div className="flex gap-3">
            <Button onClick={onPlayAgain} className="flex-1">Play Again</Button>
            <Button onClick={onBackToLobby} variant="secondary" className="flex-1">New Lobby</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RevealPhase;
