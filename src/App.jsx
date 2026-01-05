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

const PHASES = { HOME: 'home', LOBBY: 'lobby', CLUE: 'clue', DISCUSSION: 'discussion', VOTING: 'voting', REVEAL: 'reveal' };

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

const PlayerBadge = ({ name, isHost, isYou, isImpostor, showRole, eliminated }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${eliminated ? 'bg-red-500/30 line-through' : 'bg-white/10'} ${isYou ? 'ring-2 ring-purple-400' : ''}`}>
    <span className="text-lg">{isHost ? '👑' : '👤'}</span>
    <span className="text-white font-medium">{name}{isYou ? ' (You)' : ''}</span>
    {showRole && isImpostor && <span className="text-red-400 text-xs font-bold ml-1">SPY</span>}
  </div>
);

const Timer = ({ seconds, label }) => (
  <div className="text-center">
    <div className="text-4xl font-bold text-white">{seconds}s</div>
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

const LobbyScreen = ({ game, playerId, onStartGame, onUpdateSettings }) => {
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
              <PlayerBadge key={p.id} name={p.name} isHost={p.id === game.hostId} isYou={p.id === playerId} />
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
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>30s</span>
                <span>60s</span>
                <span>90s</span>
                <span>120s</span>
                <span>180s</span>
              </div>
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">Clue Time Limit: {game.settings.clueTimeLimit === 0 ? 'Unlimited' : `${game.settings.clueTimeLimit}s`}</label>
              <input
                type="range"
                min={0}
                max={60}
                step={10}
                value={game.settings.clueTimeLimit || 0}
                onChange={(e) => onUpdateSettings({ clueTimeLimit: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>None</span>
                <span>30s</span>
                <span>60s</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/60 text-sm">Show Timer</label>
              <button
                onClick={() => onUpdateSettings({ showTimer: !game.settings.showTimer })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  game.settings.showTimer ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    game.settings.showTimer ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-white/60 text-sm">Auto-End Discussion</label>
              <button
                onClick={() => onUpdateSettings({ autoEndDiscussion: !game.settings.autoEndDiscussion })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  game.settings.autoEndDiscussion ? 'bg-purple-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    game.settings.autoEndDiscussion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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

const CluePhase = ({ game, playerId, onSubmitClue }) => {
  const [clue, setClue] = useState('');
  const player = game.players.find((p) => p.id === playerId);
  const isImpostor = game.impostorIds.includes(playerId);
  const currentPlayer = game.players[game.currentClueIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const myClue = game.clues.find((c) => c.playerId === playerId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        <div className="mb-6">
          <div className="text-white/60 text-sm mb-2">Category: {game.settings.category}</div>
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
            {game.players.map((p, i) => {
              const hasClue = game.clues.find((c) => c.playerId === p.id);
              const isCurrent = i === game.currentClueIndex;
              return (
                <div key={p.id} className={`px-3 py-1 rounded-full text-sm ${isCurrent ? 'bg-purple-500 text-white' : hasClue ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-white/50'}`}>
                  {p.name}{p.id === playerId ? ' (You)' : ''}
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
      </Card>
    </div>
  );
};

const DiscussionPhase = ({ game, playerId, onEndDiscussion }) => {
  const [timeLeft, setTimeLeft] = useState(game.settings.discussionTime || 60);
  const isHost = game.hostId === playerId;
  const isImpostor = game.impostorIds.includes(playerId);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && game.settings.autoEndDiscussion && isHost) {
      onEndDiscussion();
    }
  }, [timeLeft, game.settings.autoEndDiscussion, isHost, onEndDiscussion]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        {game.settings.showTimer && (
          <div className="mb-6">
            <Timer seconds={timeLeft} label="Discussion Time" />
          </div>
        )}

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
      </Card>
    </div>
  );
};

const VotingPhase = ({ game, playerId, onVote }) => {
  const [selectedId, setSelectedId] = useState(null);
  const hasVoted = game.votes[playerId];
  const voteCount = Object.keys(game.votes).length;
  const totalPlayers = game.players.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        <div className="text-2xl font-bold text-white mb-2">🗳️ Vote!</div>
        <p className="text-white/60 mb-6">Who is the impostor?</p>
        <div className="text-white/40 text-sm mb-4">Votes: {voteCount}/{totalPlayers}</div>

        {!hasVoted ? (
          <div className="space-y-3 mb-6">
            {game.players.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                disabled={p.id === playerId}
                className={`w-full py-3 px-4 rounded-xl border transition ${
                  p.id === playerId
                    ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    : selectedId === p.id
                      ? 'bg-purple-500/30 border-purple-500 text-white'
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {p.name} {p.id === playerId ? '(You)' : ''}
              </button>
            ))}
            <Button onClick={() => onVote(selectedId)} disabled={!selectedId} className="w-full mt-4">Confirm Vote</Button>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-green-400 text-lg">✓ Vote submitted!</div>
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
      </Card>
    </div>
  );
};

const RevealPhase = ({ game, playerId, onPlayAgain, onBackToLobby }) => {
  const isHost = game.hostId === playerId;
  const eliminated = game.players.find((p) => p.id === game.eliminatedId);
  const impostors = game.players.filter((p) => game.impostorIds.includes(p.id));
  const crewWon = game.winner === 'crew';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-lg text-center">
        <div className={`text-6xl mb-4 ${crewWon ? 'animate-bounce' : ''}`}>{crewWon ? '🎉' : '😈'}</div>
        <div className="text-3xl font-bold text-white mb-2">
          {crewWon ? 'Crew Wins!' : 'Impostor Wins!'}
        </div>

        <div className="py-4 px-6 rounded-xl bg-white/10 mb-6">
          <div className="text-white/60 text-sm mb-2">The word was:</div>
          <div className="text-3xl font-bold text-purple-300">{game.secretWord}</div>
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

        {eliminated && (
          <div className="mb-6">
            <div className="text-white/60 text-sm mb-2">Eliminated:</div>
            <div className={`px-4 py-2 rounded-full inline-block ${game.impostorIds.includes(eliminated.id) ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'}`}>
              {eliminated.name} {game.impostorIds.includes(eliminated.id) ? '✓ Correct!' : '✗ Innocent!'}
            </div>
          </div>
        )}

        <div className="mb-6 p-4 rounded-xl bg-white/5">
          <div className="text-white/60 text-sm mb-3">Final Clues:</div>
          <div className="space-y-2">
            {game.clues.map((c) => {
              const p = game.players.find((pl) => pl.id === c.playerId);
              const isImp = game.impostorIds.includes(c.playerId);
              return (
                <div key={c.playerId} className={`flex justify-between items-center px-3 py-2 rounded-lg ${isImp ? 'bg-red-500/20' : 'bg-white/10'}`}>
                  <span className="text-white">{p?.name} {isImp && '🕵️'}</span>
                  <span className="text-purple-300">"{c.clue}"</span>
                </div>
              );
            })}
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

  useEffect(() => {
    sessionStorage.setItem('impostorPlayerId', playerId);
  }, [playerId]);

  // Polling for game updates
  useEffect(() => {
    if (!game?.roomCode) return;

    const poll = async () => {
      const latest = await loadGame(game.roomCode);
      if (latest && JSON.stringify(latest) !== JSON.stringify(game)) {
        setGame(latest);
        setPhase(latest.phase);
      }
    };

    pollingRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollingRef.current);
  }, [game]);

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
        discussionTime: 60,
        clueTimeLimit: 0,
        showTimer: true,
        autoEndDiscussion: false
      },
      secretWord: '',
      impostorIds: [],
      clues: [],
      currentClueIndex: 0,
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

  const startGame = async () => {
    // Shuffle players for turn order
    const shuffledPlayers = shuffleArray(game.players);

    // Randomly select impostors (NOT the first players in the array)
    const impostorCount = Math.min(game.settings.numImpostors, Math.floor(shuffledPlayers.length / 3));
    const allPlayerIds = shuffledPlayers.map(p => p.id);
    const shuffledIds = shuffleArray(allPlayerIds);
    const impostorIds = shuffledIds.slice(0, impostorCount);

    const language = game.settings.language || 'en';
    const secretWord = pickRandom(WORD_CATEGORIES[language][game.settings.category]);

    const updated = {
      ...game,
      players: shuffledPlayers,
      impostorIds,
      secretWord,
      phase: PHASES.CLUE,
      clues: [],
      currentClueIndex: 0,
      votes: {},
      eliminatedId: null,
      winner: null
    };
    await saveGame(updated);
    setGame(updated);
    setPhase(PHASES.CLUE);
  };

  const submitClue = async (clue) => {
    const updated = { ...game };
    updated.clues.push({ playerId, clue: clue.trim() });
    updated.currentClueIndex++;

    if (updated.currentClueIndex >= updated.players.length) {
      updated.phase = PHASES.DISCUSSION;
    }

    await saveGame(updated);
    setGame(updated);
    setPhase(updated.phase);
  };

  const endDiscussion = async () => {
    const updated = { ...game, phase: PHASES.VOTING };
    await saveGame(updated);
    setGame(updated);
    setPhase(PHASES.VOTING);
  };

  const vote = async (votedForId) => {
    const updated = { ...game };
    updated.votes[playerId] = votedForId;

    if (Object.keys(updated.votes).length >= updated.players.length) {
      // Tally votes
      const tally = {};
      Object.values(updated.votes).forEach((v) => { tally[v] = (tally[v] || 0) + 1; });
      const maxVotes = Math.max(...Object.values(tally));
      const eliminated = Object.entries(tally).find(([id, count]) => count === maxVotes)?.[0];

      updated.eliminatedId = eliminated;
      updated.winner = updated.impostorIds.includes(eliminated) ? 'crew' : 'impostor';
      updated.phase = PHASES.REVEAL;
    }

    await saveGame(updated);
    setGame(updated);
    setPhase(updated.phase);
  };

  const playAgain = async () => {
    // Shuffle players for turn order
    const shuffledPlayers = shuffleArray(game.players);

    // Randomly select impostors (NOT the first players in the array)
    const impostorCount = Math.min(game.settings.numImpostors, Math.floor(shuffledPlayers.length / 3));
    const allPlayerIds = shuffledPlayers.map(p => p.id);
    const shuffledIds = shuffleArray(allPlayerIds);
    const impostorIds = shuffledIds.slice(0, impostorCount);

    const language = game.settings.language || 'en';
    const secretWord = pickRandom(WORD_CATEGORIES[language][game.settings.category]);

    const updated = {
      ...game,
      players: shuffledPlayers,
      impostorIds,
      secretWord,
      phase: PHASES.CLUE,
      clues: [],
      currentClueIndex: 0,
      votes: {},
      eliminatedId: null,
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
      currentClueIndex: 0,
      votes: {},
      eliminatedId: null,
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
      {phase === PHASES.LOBBY && game && <LobbyScreen game={game} playerId={playerId} onStartGame={startGame} onUpdateSettings={updateSettings} />}
      {phase === PHASES.CLUE && game && <CluePhase game={game} playerId={playerId} onSubmitClue={submitClue} />}
      {phase === PHASES.DISCUSSION && game && <DiscussionPhase game={game} playerId={playerId} onEndDiscussion={endDiscussion} />}
      {phase === PHASES.VOTING && game && <VotingPhase game={game} playerId={playerId} onVote={vote} />}
      {phase === PHASES.REVEAL && game && <RevealPhase game={game} playerId={playerId} onPlayAgain={playAgain} onBackToLobby={backToLobby} />}
    </div>
  );
}
