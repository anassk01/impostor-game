import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================
// CONSTANTS & WORD DATA
// ============================================
const WORD_CATEGORIES = {
  en: {
    food: ['Pizza', 'Sushi', 'Burger', 'Taco', 'Pasta', 'Ice Cream', 'Chocolate', 'Steak', 'Salad', 'Soup', 'Sandwich', 'Pancake', 'Donut', 'Popcorn', 'Cheese'],
    animals: ['Dog', 'Cat', 'Elephant', 'Lion', 'Penguin', 'Dolphin', 'Eagle', 'Snake', 'Rabbit', 'Tiger', 'Bear', 'Monkey', 'Giraffe', 'Wolf', 'Owl'],
    movies: ['Titanic', 'Avatar', 'Inception', 'Frozen', 'Jaws', 'Matrix', 'Shrek', 'Batman', 'Joker', 'Alien', 'Rocky', 'Gladiator', 'Up', 'Coco', 'Moana'],
    places: ['Beach', 'Mountain', 'Paris', 'Hospital', 'School', 'Airport', 'Museum', 'Library', 'Restaurant', 'Zoo', 'Stadium', 'Castle', 'Desert', 'Forest', 'Island'],
    sports: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Golf', 'Baseball', 'Hockey', 'Boxing', 'Skiing', 'Surfing', 'Cycling', 'Wrestling', 'Volleyball', 'Rugby', 'Cricket'],
    objects: ['Phone', 'Guitar', 'Clock', 'Mirror', 'Umbrella', 'Candle', 'Camera', 'Scissors', 'Balloon', 'Ladder', 'Hammer', 'Pillow', 'Backpack', 'Glasses', 'Key']
  },
  ar: {
    food: ['بيتزا', 'سوشي', 'برجر', 'تاكو', 'باستا', 'آيس كريم', 'شوكولاتة', 'ستيك', 'سلطة', 'شوربة', 'ساندويتش', 'فطيرة', 'دونات', 'فشار', 'جبن'],
    animals: ['كلب', 'قطة', 'فيل', 'أسد', 'بطريق', 'دولفين', 'نسر', 'ثعبان', 'أرنب', 'نمر', 'دب', 'قرد', 'زرافة', 'ذئب', 'بومة'],
    movies: ['تايتانيك', 'أفاتار', 'إنسبشن', 'فروزن', 'جوز', 'ماتريكس', 'شريك', 'باتمان', 'جوكر', 'إليين', 'روكي', 'جلادياتور', 'أب', 'كوكو', 'موانا'],
    places: ['شاطئ', 'جبل', 'باريس', 'مستشفى', 'مدرسة', 'مطار', 'متحف', 'مكتبة', 'مطعم', 'حديقة حيوان', 'ملعب', 'قصر', 'صحراء', 'غابة', 'جزيرة'],
    sports: ['كرة قدم', 'كرة سلة', 'تنس', 'سباحة', 'جولف', 'بيسبول', 'هوكي', 'ملاكمة', 'تزلج', 'ركوب أمواج', 'دراجات', 'مصارعة', 'كرة طائرة', 'رجبي', 'كريكيت'],
    objects: ['هاتف', 'جيتار', 'ساعة', 'مرآة', 'مظلة', 'شمعة', 'كاميرا', 'مقص', 'بالون', 'سلم', 'مطرقة', 'وسادة', 'حقيبة ظهر', 'نظارات', 'مفتاح']
  }
};

const CATEGORY_NAMES = {
  en: { food: 'Food', animals: 'Animals', movies: 'Movies', places: 'Places', sports: 'Sports', objects: 'Objects' },
  ar: { food: 'طعام', animals: 'حيوانات', movies: 'أفلام', places: 'أماكن', sports: 'رياضة', objects: 'أشياء' }
};

const PHASES = { HOME: 'home', LOBBY: 'lobby', CLUE: 'clue', DISCUSSION: 'discussion', VOTING: 'voting', ROUND_RESULT: 'round_result', REVEAL: 'reveal' };

// Helper to check win conditions
const checkWinCondition = (players, impostorIds, eliminatedIds = []) => {
  const alivePlayers = players.filter(p => !eliminatedIds.includes(p.id));
  const aliveImpostors = alivePlayers.filter(p => impostorIds.includes(p.id));
  const aliveCrew = alivePlayers.filter(p => !impostorIds.includes(p.id));

  if (aliveImpostors.length === 0) return 'crew'; // All impostors eliminated
  if (aliveImpostors.length >= aliveCrew.length) return 'impostor'; // Impostors outnumber or equal crew
  return null; // Game continues
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const generateId = () => Math.random().toString(36).substring(2, 10);
const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase();
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ============================================
// STORAGE HELPERS
// ============================================
const getGameKey = (code) => `impostor:${code}`;

const loadGame = async (roomCode) => {
  try {
    const result = await window.storage.get(getGameKey(roomCode), true);
    return result ? JSON.parse(result.value) : null;
  } catch { return null; }
};

const saveGame = async (game) => {
  try {
    await window.storage.set(getGameKey(game.roomCode), JSON.stringify(game), true);
    return true;
  } catch { return false; }
};

// ============================================
// UI COMPONENTS
// ============================================
const Button = ({ children, onClick, variant = 'primary', disabled, className = '' }) => {
  const base = 'px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

const Input = ({ value, onChange, placeholder, maxLength, className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    className={`w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
  />
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${className}`}>{children}</div>
);

const PlayerBadge = ({ name, isHost, isYou, isImpostor, showRole, eliminated, canKick, onKick }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${eliminated ? 'bg-red-500/30 line-through' : 'bg-white/10'} ${isYou ? 'ring-2 ring-purple-400' : ''}`}>
    <span className="text-lg">{isHost ? '👑' : '👤'}</span>
    <span className="text-white font-medium">{name}{isYou ? ' (You)' : ''}</span>
    {showRole && isImpostor && <span className="text-red-400 text-xs font-bold ml-1">SPY</span>}
    {canKick && !isYou && !isHost && (
      <button onClick={onKick} className="ml-1 text-red-400 hover:text-red-300 text-sm font-bold">✕</button>
    )}
  </div>
);

const Timer = ({ seconds, label }) => (
  <div className="text-center">
    <div className={`text-4xl font-bold ${seconds <= 10 ? 'text-red-400' : 'text-white'}`}>{seconds}s</div>
    <div className="text-white/60 text-sm">{label}</div>
  </div>
);

// ============================================
// PHASE COMPONENTS
// ============================================
const HomeScreen = ({ onCreateGame, onJoinGame }) => {
  const [joinCode, setJoinCode] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.length === 4) setJoinCode(hash.toUpperCase());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white mb-2">🕵️ IMPOSTOR</h1>
        <p className="text-xl text-purple-200">Find the spy among us!</p>
      </div>
      <Card className="w-full max-w-md space-y-4">
        <Input value={name} onChange={setName} placeholder="Enter your name" maxLength={15} />
        <Button onClick={() => onCreateGame(name)} disabled={!name.trim()} className="w-full">Create Game</Button>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/50 text-sm">or join</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>
        <div className="flex gap-2">
          <Input value={joinCode} onChange={(v) => setJoinCode(v.toUpperCase())} placeholder="Room Code" maxLength={4} className="flex-1 text-center tracking-widest font-mono text-xl" />
          <Button onClick={() => onJoinGame(name, joinCode)} disabled={!name.trim() || joinCode.length !== 4} variant="secondary">Join</Button>
        </div>
      </Card>
    </div>
  );
};

const LobbyScreen = ({ game, playerId, onStartGame, onUpdateSettings, onKickPlayer }) => {
  const isHost = game.hostId === playerId;
  const shareUrl = `${window.location.origin}${window.location.pathname}#${game.roomCode}`;
  const [copied, setCopied] = useState(false);

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
      </Card>
    </div>
  );
};

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

  // Synced timer based on turnStartTime
  const calculateTimeLeft = (allowNegative = false) => {
    if (!game.turnStartTime) return clueTime;
    const elapsed = Math.floor((Date.now() - game.turnStartTime) / 1000);
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
            {alivePlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleSelection(p.id)}
                disabled={p.id === playerId}
                className={`w-full py-3 px-4 rounded-xl border transition ${
                  p.id === playerId
                    ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    : selectedIds.includes(p.id)
                      ? 'bg-purple-500/30 border-purple-500 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {p.name} {p.id === playerId ? '(You)' : ''}
                {selectedIds.includes(p.id) && ' ✓'}
              </button>
            ))}
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
