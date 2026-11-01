import { useCallback, useEffect, useRef, useState } from 'react'
import { playRoomUrl } from './roomCode'

const INITIAL = {
  connected: false,
  error: null,
  notice: null,
  roomId: null,
  boardSize: 3,
  squares: null,
  xIsNext: true,
  status: { type: 'playing', currentPlayer: 'X' },
  myRole: null,
  inLobby: false,
  inQueue: false,
  watchingOnly: false,
  queuePosition: null,
  queueCount: 0,
  lobbyCount: 0,
  queueFull: false,
  series: { X: 0, O: 0 },
  seatRoomWins: { X: 0, O: 0 },
  myRoomWins: 0,
  scores: { X: 0, O: 0 },
  hostPresent: false,
  guestPresent: false,
  waitingForOpponent: true,
  opponentLeft: false,
  canControl: false,
}

export function useRoom(roomCode) {
  const [state, setState] = useState(INITIAL)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!roomCode) {
      setState(INITIAL)
      return undefined
    }

    setState((prev) => ({ ...INITIAL, roomId: roomCode, error: prev.error }))

    const url = playRoomUrl(roomCode)
    const socket = new WebSocket(url)
    socketRef.current = socket

    function onOpen() {
      setState((prev) => ({ ...prev, connected: true, error: null }))
    }

    function onMessage(event) {
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }

      if (data.type === 'error') {
        // Soft errors (queue full) stay connected
        if (data.code === 'QUEUE_FULL') {
          setState((prev) => ({
            ...prev,
            notice: data.message || 'Player queue is full.',
          }))
          return
        }
        setState((prev) => ({
          ...prev,
          error: data.message || 'Could not join room',
          connected: false,
        }))
        return
      }

      if (data.type === 'state') {
        const series = data.series || data.scores || { X: 0, O: 0 }
        setState({
          connected: true,
          error: null,
          notice: null,
          roomId: data.roomId,
          boardSize: data.boardSize,
          squares: data.squares,
          xIsNext: data.xIsNext,
          status: data.status,
          myRole: data.myRole,
          inLobby: Boolean(data.inLobby),
          inQueue: Boolean(data.inQueue),
          watchingOnly: Boolean(data.inLobby || data.watchingOnly),
          queuePosition: data.queuePosition ?? null,
          queueCount: data.queueCount ?? 0,
          lobbyCount: data.lobbyCount ?? 0,
          queueFull: Boolean(data.queueFull),
          series,
          seatRoomWins: data.seatRoomWins || { X: 0, O: 0 },
          myRoomWins: data.myRoomWins ?? 0,
          scores: series,
          hostPresent: data.hostPresent,
          guestPresent: data.guestPresent,
          waitingForOpponent: data.waitingForOpponent,
          opponentLeft: data.opponentLeft,
          canControl: data.canControl,
        })
      }
    }

    function onClose() {
      setState((prev) => ({ ...prev, connected: false }))
    }

    function onError() {
      setState((prev) => ({
        ...prev,
        connected: false,
        error:
          prev.error ||
          'Could not connect to the play room. Check your connection and try again.',
      }))
    }

    socket.addEventListener('open', onOpen)
    socket.addEventListener('message', onMessage)
    socket.addEventListener('close', onClose)
    socket.addEventListener('error', onError)

    return () => {
      socket.removeEventListener('open', onOpen)
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('close', onClose)
      socket.removeEventListener('error', onError)
      socket.close()
      socketRef.current = null
    }
  }, [roomCode])

  const send = useCallback((payload) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify(payload))
  }, [])

  const playMove = useCallback(
    (index) => send({ type: 'move', index }),
    [send],
  )
  const resetGame = useCallback(() => send({ type: 'reset' }), [send])
  const setBoardSize = useCallback(
    (size) => send({ type: 'setSize', size }),
    [send],
  )
  const moveToLobby = useCallback(() => send({ type: 'moveToLobby' }), [send])
  const enterQueue = useCallback(() => send({ type: 'enterQueue' }), [send])

  return {
    ...state,
    playMove,
    resetGame,
    setBoardSize,
    moveToLobby,
    enterQueue,
  }
}
