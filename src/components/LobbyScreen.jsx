import { useState } from 'react';
import { Button, Card, PlayerBadge } from './ui';
import { WORD_CATEGORIES, CATEGORY_NAMES } from '../constants';

const LobbyScreen = ({ game, playerId, onStartGame, onUpdateSettings, onKickPlayer }) => {
  const isHost = game.hostId === playerId;
  const shareUrl = `${window.location.origin}${window.location.pathname}#${game.roomCode}`;
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-white/60 text-sm mb-1">Room Code</div>
          <div className="text-4xl font-mono font-bold text-white tracking-widest">{game.roomCode}</div>
        </div>
        <button onClick={copyLink} className="w-full py-3 px-4 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:bg-purple-500/30 transition mb-6 text-sm">
          {copied ? '✓ Link Copied!' : '📋 Copy Invite Link'}
        </button>

        <div className="mb-6">
          <div className="text-white/60 text-sm mb-3">Players ({game.players.length}/20)</div>
          <div className="flex flex-wrap gap-2">
            {game.players.map((p) => (
              <PlayerBadge
                key={p.id}
                name={p.name}
                isHost={p.id === game.hostId}
                isYou={p.id === playerId}
                canKick={isHost}
                onKick={() => onKickPlayer(p.id)}
              />
            ))}
          </div>
        </div>

        {isHost && (
          <div className="space-y-4 mb-6 p-4 rounded-xl bg-white/5">
            <div>
              <label className="text-white/60 text-sm block mb-2">Language / اللغة</label>
              <select
                value={game.settings.language || 'en'}
                onChange={(e) => onUpdateSettings({ language: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
              >
                <option value="en" className="bg-gray-800">English</option>
                <option value="ar" className="bg-gray-800">العربية (Arabic)</option>
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">Category</label>
              <select
                value={game.settings.category}
                onChange={(e) => onUpdateSettings({ category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20"
              >
                {Object.keys(WORD_CATEGORIES[game.settings.language || 'en']).map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-800">
                    {CATEGORY_NAMES[game.settings.language || 'en'][cat]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">Impostors: {game.settings.numImpostors}</label>
              <input
                type="range"
                min={1}
                max={Math.max(1, Math.floor(game.players.length / 3))}
                value={game.settings.numImpostors}
                onChange={(e) => onUpdateSettings({ numImpostors: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">Clue Time (per player): {game.settings.clueTime || 30}s</label>
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                value={game.settings.clueTime || 30}
                onChange={(e) => onUpdateSettings({ clueTime: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">Discussion Time: {game.settings.discussionTime || 60}s</label>
              <input
                type="range"
                min={30}
                max={180}
                step={15}
                value={game.settings.discussionTime || 60}
                onChange={(e) => onUpdateSettings({ discussionTime: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">Voting Time: {game.settings.votingTime || 45}s</label>
              <input
                type="range"
                min={20}
                max={120}
                step={10}
                value={game.settings.votingTime || 45}
                onChange={(e) => onUpdateSettings({ votingTime: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">
                Votes per Player: {game.settings.votesPerPlayer || 1}
                {game.settings.votesPerPlayer > 1 && <span className="text-purple-300 ml-2">(Multiple votes enabled)</span>}
              </label>
              <input
                type="range"
                min={1}
                max={Math.max(1, Math.floor((game.players.length - 1) / 2))}
                value={game.settings.votesPerPlayer || 1}
                onChange={(e) => onUpdateSettings({ votesPerPlayer: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-white/40 text-xs mt-1">
                Max votes scales with player count. Each player can vote for {game.settings.votesPerPlayer || 1} different player{(game.settings.votesPerPlayer || 1) > 1 ? 's' : ''}.
              </div>
            </div>
          </div>
        )}

        {isHost ? (
          <Button onClick={onStartGame} disabled={game.players.length < 3} className="w-full">
            {game.players.length < 3 ? `Need ${3 - game.players.length} more players` : 'Start Game'}
          </Button>
        ) : (
          <div className="text-center text-white/60">Waiting for host to start...</div>
        )}

        {/* Rules Toggle */}
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full mt-4 py-2 text-purple-300 hover:text-purple-200 text-sm transition"
        >
          {showRules ? '▲ Hide Rules' : '▼ Show Rules'}
        </button>

        {showRules && (
          <div className="mt-4 p-4 rounded-xl bg-white/5 text-left">
            <h3 className="text-white font-bold mb-3 text-center">📜 Game Rules</h3>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-purple-300 font-semibold">🎯 Objective</div>
                <div className="text-white/70">
                  <span className="text-green-400">Crew:</span> Find and eliminate all impostors.<br/>
                  <span className="text-red-400">Impostor:</span> Blend in and avoid detection.
                </div>
              </div>

              <div>
                <div className="text-purple-300 font-semibold">🔄 Game Flow</div>
                <div className="text-white/70">
                  1. Everyone sees a secret word (except impostors)<br/>
                  2. Take turns giving one-word clues<br/>
                  3. Discuss who seems suspicious<br/>
                  4. Vote to eliminate someone<br/>
                  5. Repeat until a team wins
                </div>
              </div>

              <div>
                <div className="text-purple-300 font-semibold">🗳️ Voting Rules</div>
                <div className="text-white/70">
                  • Player with most votes is eliminated<br/>
                  • <span className="text-yellow-400">Tie:</span> Random selection among tied players<br/>
                  • <span className="text-yellow-400">No votes:</span> No one is eliminated<br/>
                  • Eliminated players can watch but not participate
                </div>
              </div>

              <div>
                <div className="text-purple-300 font-semibold">🏆 Win Conditions</div>
                <div className="text-white/70">
                  • <span className="text-green-400">Crew wins:</span> All impostors eliminated<br/>
                  • <span className="text-red-400">Impostor wins:</span> Impostors equal or outnumber crew
                </div>
              </div>

              <div>
                <div className="text-purple-300 font-semibold">⏱️ Timers</div>
                <div className="text-white/70">
                  • Clue time: Per player, auto-skip if no clue<br/>
                  • Discussion: Talk before voting<br/>
                  • Voting: Cast votes within time limit
                </div>
              </div>

              <div>
                <div className="text-purple-300 font-semibold">🔁 Multiple Rounds</div>
                <div className="text-white/70">
                  • Impostors stay the same across rounds<br/>
                  • New secret word each round<br/>
                  • Game continues until win condition met
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LobbyScreen;
