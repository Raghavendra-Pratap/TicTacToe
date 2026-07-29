# Submission — Tic Tac Toe (React)

## Description

Build a Tic Tac Toe game using React.

The project should have a clean and interactive UI with good styling using CSS or Tailwind CSS. Focus on component structure, state management, game logic, and user interaction.

The app should include:

- [x] 3×3 game board
- [x] Two-player turn system
- [x] Winner detection
- [x] Draw detection
- [x] Reset game option
- [x] Clear visual feedback for current turn and result

Extras shipped beyond the brief:

- 4×4 / 5×5 boards
- Online play rooms (invite link / code via PartyKit)
- Responsive / adaptive layout

## Submit

| Field | Link |
|---|---|
| **Live hosted link** | https://raghav.it/games/tic-tac-toe/ |
| **Public GitHub repository** | _paste URL after the repo is public_ |

## How to verify

1. Open the live link — board loads in local mode.
2. Play X/O until win or draw — status updates; winning cells highlight; Reset / Play again works.
3. Switch board size 3 / 4 / 5.
4. (Optional online) Open **Play room** → Create room → copy invite → open in a second browser; guest is O; turns sync.

## Local reproduce

```bash
git clone <your-public-repo-url>
cd TicTacToe
npm install
npm run dev
```

## Notes

- Hosted build lives under `raghav.it-dev/games/tic-tac-toe/` (static Vite `dist`).
- Online rooms need a deployed PartyKit host (`VITE_PARTYKIT_HOST`). Without it, local play still fulfills the assignment requirements.
