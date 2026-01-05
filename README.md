# 🕵️ Impostor Challenge

A multiplayer social deduction game where players try to find the spy among them!

## Features

- 🎮 **Room System**: 4-letter codes with auto-join via URL hash
- 🔗 **Share Link**: One-click copy invite link
- 🎯 **6 Word Categories**: Food, Animals, Movies, Places, Sports, Objects
- 🕵️ **Flexible Impostors**: 1 to ⅓ of players can be spies
- 💬 **Turn-Based Clues**: Each player gives one-word clue
- ⏱️ **Discussion Timer**: 60 second countdown
- 🗳️ **Voting**: Anonymous votes, majority eliminates
- 🎉 **Results**: Full reveal with clue recap

## How to Play

1. **Create or Join a Game**: Enter your name and create a new game or join using a room code
2. **Wait in Lobby**: Host can adjust settings (category, number of impostors)
3. **Get Your Role**: You'll either know the secret word or be an impostor
4. **Give Clues**: Each player gives a one-word clue (impostors must blend in!)
5. **Discuss**: Talk about who seems suspicious
6. **Vote**: Everyone votes for who they think is the impostor
7. **Reveal**: See if you caught the spy!

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- LocalStorage for game state

## License

MIT
