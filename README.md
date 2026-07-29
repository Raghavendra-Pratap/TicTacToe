# Tic Tac Toe

A two-player Tic Tac Toe game built with **React** and **Tailwind CSS**. Play locally on one device, or open **Play room** to invite a friend with a link or room code (PartyKit).

**Live (raghav.it):** https://raghav.it/games/tic-tac-toe/  
**Source:** https://github.com/Raghavendra-Pratap/TicTacToe

## Assignment brief

Build a Tic Tac Toe game using React with a clean interactive UI (CSS or Tailwind). Focus on component structure, state management, game logic, and user interaction.

| Requirement | Status |
|---|---|
| React + styled UI (Tailwind) | Done |
| 3×3 game board | Done (also 4×4 / 5×5) |
| Two-player turn system | Done |
| Winner detection | Done |
| Draw detection | Done |
| Reset game | Done |
| Clear visual feedback (turn + result) | Done |
| Live hosted link | https://raghav.it/games/tic-tac-toe/ |
| Public GitHub repository link | https://github.com/Raghavendra-Pratap/TicTacToe |

See [SUBMISSION.md](./SUBMISSION.md) for the submit checklist and links.

## Features

- Adaptive board: 3×3, 4×4, 5×5 (N-in-a-row wins)
- Local same-device play (default landing)
- Collapsible **Play room** (desktop corner card / mobile popup)
- Online rooms: create → share link/code → guest joins as O
- Winning-line highlight, draw detection, reset / play again
- Responsive sizing across phone and desktop

## Stack

- React 18 + Vite 5
- Tailwind CSS 3
- PartyKit + PartySocket (optional online rooms)

## Project structure

```
src/
  App.jsx                 # Local + online game shell
  components/             # Board, Square, StatusBanner, RoomPanel, …
  online/                 # useRoom, room codes
  utils/gameLogic.js      # Winner / draw / status (shared with server)
party/tictactoe.js        # Authoritative PartyKit room server
```

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 — board loads locally. Use **Play room** for online.

### Online rooms (optional)

```bash
# Terminal 1
npm run dev:party

# Terminal 2
npm run dev
```

Copy `.env.example` → `.env` if needed:

```bash
VITE_PARTYKIT_HOST=127.0.0.1:1999
```

### Production build

```bash
npm run build
npm run preview
```

Build for raghav.it subdirectory:

```bash
VITE_BASE=/games/tic-tac-toe/ npm run build
```

Deploy PartyKit (online rooms on the public site):

```bash
npm run deploy
# then rebuild the frontend with
# VITE_PARTYKIT_HOST=<your>.partykit.dev
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite frontend |
| `npm run dev:party` | PartyKit rooms |
| `npm run build` | Production frontend |
| `npm run preview` | Preview `dist/` |
| `npm run deploy` | Deploy PartyKit server |

## License

MIT
