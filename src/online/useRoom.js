import { useCallback, useEffect, useRef, useState } from 'react'
import PartySocket from 'partysocket'
import { partyHost } from './roomCode'

const INITIAL = {
  connected: false,
  error: null,
  roomId: null,
  boardSize: 3,
  squares: null,
  xIsNext: true,
  status: { type: 'playing', currentPlayer: 'X' },
  myRole: null,
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

    const socket = new PartySocket({
      host: partyHost(),
      room: roomCode,
      party: 'main',
    })
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
        setState((prev) => ({
          ...prev,
          error: data.message || 'Could not join room',
          connected: false,
        }))
        return
      }

      if (data.type === 'state') {
        setState({
          connected: true,
          error: null,
          roomId: data.roomId,
          boardSize: data.boardSize,
          squares: data.squares,
          xIsNext: data.xIsNext,
          status: data.status,
          myRole: data.myRole,
          hostPresent: data.hostPresent,
          guestPresent: data.guestPresent,
          waitingForOpponent: data.waitingForOpponent,
          opponentLeft: data.opponentLeft,
          canControl: data.canControl,
        })
      }
    }

    function onClose(event) {
      if (event.code === 4000) {
        setState((prev) => ({
          ...prev,
          connected: false,
          error: prev.error || 'This room already has two players.',
        }))
        return
      }
      setState((prev) => ({ ...prev, connected: false }))
    }

    function onError() {
      setState((prev) => ({
        ...prev,
        connected: false,
        error:
          prev.error ||
          'Could not connect to the play room. Is PartyKit running?',
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

  const play = useCallback(
    (index) => {
      send({ type: 'move', index })
    },
    [send],
  )

  const reset = useCallback(() => {
    send({ type: 'reset' })
  }, [send])

  const setSize = useCallback(
    (size) => {
      send({ type: 'setSize', size })
    },
    [send],
  )

  return { ...state, play, reset, setSize }
}
