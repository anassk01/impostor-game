import { useState, useEffect } from 'react';
import { Button, Input, Card } from './ui';

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

export default HomeScreen;
