// ============================================
// UI COMPONENTS
// ============================================

export const Button = ({ children, onClick, variant = 'primary', disabled, className = '' }) => {
  const base = 'px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

export const Input = ({ value, onChange, placeholder, maxLength, className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    className={`w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 ${className}`}
  />
);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${className}`}>{children}</div>
);

export const PlayerBadge = ({ name, isHost, isYou, isImpostor, showRole, eliminated, canKick, onKick }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${eliminated ? 'bg-red-500/30 line-through' : 'bg-white/10'} ${isYou ? 'ring-2 ring-purple-400' : ''}`}>
    <span className="text-lg">{isHost ? '👑' : '👤'}</span>
    <span className="text-white font-medium">{name}{isYou ? ' (You)' : ''}</span>
    {showRole && isImpostor && <span className="text-red-400 text-xs font-bold ml-1">SPY</span>}
    {canKick && !isYou && !isHost && (
      <button onClick={onKick} className="ml-1 text-red-400 hover:text-red-300 text-sm font-bold">✕</button>
    )}
  </div>
);

export const Timer = ({ seconds, label }) => (
  <div className="text-center">
    <div className={`text-4xl font-bold ${seconds <= 10 ? 'text-red-400' : 'text-white'}`}>{seconds}s</div>
    <div className="text-white/60 text-sm">{label}</div>
  </div>
);
