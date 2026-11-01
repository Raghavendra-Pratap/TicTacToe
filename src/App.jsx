import { useEffect, useState } from 'react'
import Board from './components/Board'
import BoardSizeSelector from './components/BoardSizeSelector'
import StatusBanner from './components/StatusBanner'
import RoomPanel from './components/RoomPanel'
import { createEmptyBoard, getGameStatus } from './utils/gameLogic'
import { useRoom } from './online/useRoom'
import {
  generateRoomCode,
  normalizeRoomCode,
  readRoomFromUrl,
  writeRoomToUrl,
} from './online/roomCode'

const DEFAULT_SIZE = 3

export default function App() {
  const [roomCode, setRoomCode] = useState(() => readRoomFromUrl() || '')
  const online = Boolean(roomCode)

  const [localSize, setLocalSize] = useState(DEFAULT_SIZE)
  const [localSquares, setLocalSquares] = useState(() =>
    createEmptyBoard(DEFAULT_SIZE),
  )
  const [localXIsNext, setLocalXIsNext] = useState(true)

  const room = useRoom(online ? roomCode : null)

  useEffect(() => {
    writeRoomToUrl(online ? roomCode : null)
  }, [online, roomCode])

  const boardSize = online ? room.boardSize || DEFAULT_SIZE : localSize
  const squares = online ? room.squares || [] : localSquares
  const status = online
    ? room.status || { type: 'playing', currentPlayer: 'X' }
    : getGameStatus(localSquares, localXIsNext, localSize)

  const gameOver = status.type === 'win' || status.type === 'draw'
  const spectating = online && !room.myRole && (room.inQueue || room.inLobby)

  const myTurn =
    online &&
    room.connected &&
    Boolean(room.myRole) &&
    !room.waitingForOpponent &&
    !gameOver &&
    status.type === 'playing' &&
    status.currentPlayer === room.myRole

  const boardLocked =
    online &&
    (spectating || room.waitingForOpponent || gameOver || !myTurn)

  function handlePlay(index) {
    if (online) {
      if (!myTurn) return
      room.playMove(index)
      return
    }
    if (localSquares[index] || gameOver) return
    const next = localSquares.slice()
    next[index] = localXIsNext ? 'X' : 'O'
    setLocalSquares(next)
    setLocalXIsNext(!localXIsNext)
  }

  function handleReset() {
    if (online) {
      if (room.canControl) room.resetGame()
      return
    }
    setLocalSquares(createEmptyBoard(localSize))
    setLocalXIsNext(true)
  }

  function handleBoardSizeChange(size) {
    if (online) {
      if (room.canControl) room.setBoardSize(size)
      return
    }
    setLocalSize(size)
    setLocalSquares(createEmptyBoard(size))
    setLocalXIsNext(true)
  }

  function createRoom() {
    setRoomCode(generateRoomCode())
  }

  function joinRoom(code) {
    const normalized = normalizeRoomCode(code)
    if (!normalized) return
    setRoomCode(normalized)
  }

  function leaveRoom() {
    setRoomCode('')
  }

  let turnHint = null
  if (spectating && room.connected) {
    if (room.inQueue && room.queuePosition) {
      turnHint = `Player queue · #${room.queuePosition}`
    } else if (room.inLobby) {
      turnHint = 'Lobby · watching only'
    } else {
      turnHint = 'Watching'
    }
  } else if (
    online &&
    room.connected &&
    room.myRole &&
    !room.waitingForOpponent &&
    !gameOver
  ) {
    turnHint = myTurn ? 'Your turn' : `Waiting for ${status.currentPlayer}…`
  }

  const canChangeSize = !online || room.canControl
  const canReset = !online || room.canControl
  const showGuestResetWait =
    online && Boolean(room.myRole) && !room.canControl && gameOver
  const showScores = online && room.connected && !room.error
  const series = room.series || room.scores || { X: 0, O: 0 }
  const seatRoom = room.seatRoomWins || { X: 0, O: 0 }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute left-4 top-4 z-30 sm:left-6 sm:top-6">
        <RoomPanel
          online={online}
          roomCode={roomCode}
          myRole={room.myRole}
          inLobby={room.inLobby}
          inQueue={room.inQueue}
          queuePosition={room.queuePosition}
          queueCount={room.queueCount}
          lobbyCount={room.lobbyCount}
          queueFull={room.queueFull}
          myRoomWins={room.myRoomWins}
          waitingForOpponent={room.waitingForOpponent}
          opponentLeft={room.opponentLeft}
          connected={room.connected}
          error={room.error}
          notice={room.notice}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
          onMoveToLobby={room.moveToLobby}
          onEnterQueue={room.enterQueue}
        />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-12">
        <main className="flex w-full max-w-[46rem] flex-col items-center space-y-6 sm:space-y-8">
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Tic Tac Toe
            </h1>
            <p className="mt-2 text-base text-slate-400 sm:text-lg">
              {online
                ? spectating
                  ? room.inQueue
                    ? 'Online · player queue'
                    : 'Online · lobby'
                  : 'Online play room'
                : 'Local · two players · X goes first'}
            </p>
          </header>

          {showScores && (
            <div className="space-y-1 text-center" aria-label="Scores">
              <p className="text-sm text-slate-400 sm:text-base">
                <span className="text-slate-500">This series </span>
                <span className="font-bold text-sky-400">X</span> {series.X ?? 0}
                <span className="mx-2 text-slate-600">·</span>
                <span className="font-bold text-rose-400">O</span> {series.O ?? 0}
              </p>
              <p className="text-xs text-slate-500 sm:text-sm">
                Room wins{' '}
                <span className="text-sky-400">X {seatRoom.X ?? 0}</span>
                <span className="mx-1.5 text-slate-600">·</span>
                <span className="text-rose-400">O {seatRoom.O ?? 0}</span>
                {typeof room.myRoomWins === 'number' ? (
                  <span className="text-slate-600"> · you {room.myRoomWins}</span>
                ) : null}
              </p>
            </div>
          )}

          {canChangeSize ? (
            <BoardSizeSelector
              size={boardSize}
              onChange={handleBoardSizeChange}
              disabled={online && !room.connected}
            />
          ) : (
            <p className="text-center text-sm text-slate-500">
              Board size: {boardSize}×{boardSize}
              {spectating ? ' · watching' : ' (host controls)'}
            </p>
          )}

          {turnHint && (
            <p
              className={`text-center text-sm font-medium sm:text-base ${
                myTurn
                  ? 'text-emerald-400'
                  : spectating
                    ? 'text-amber-400'
                    : 'text-slate-400'
              }`}
              role="status"
            >
              {turnHint}
            </p>
          )}

          <StatusBanner status={status} boardSize={boardSize} />

          <div className="flex w-full justify-center overflow-visible">
            <Board
              squares={squares}
              onPlay={handlePlay}
              winningLine={status.line}
              gameOver={online ? boardLocked || gameOver : gameOver}
              size={boardSize}
            />
          </div>

          {canReset && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleReset}
                disabled={online && !room.connected}
                className="rounded-lg bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-4 sm:text-lg"
              >
                {gameOver ? 'Play again' : 'Reset game'}
              </button>
            </div>
          )}

          {showGuestResetWait && (
            <p className="text-center text-sm text-slate-500">
              Waiting for host to start a new game…
            </p>
          )}

          {spectating && room.inQueue && (
            <p className="text-center text-sm text-slate-500">
              You join the board when a seat opens
            </p>
          )}
          {spectating && room.inLobby && (
            <p className="text-center text-sm text-slate-500">
              Watching only · use Play room → Join player queue to play
            </p>
          )}

          <div className="flex justify-center gap-8 text-sm text-slate-500 sm:text-base">
            <span>
              <span className="font-bold text-sky-400">X</span>
              {online ? ' — Host' : ' — Player 1'}
            </span>
            <span>
              <span className="font-bold text-rose-400">O</span>
              {online ? ' — Guest' : ' — Player 2'}
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
