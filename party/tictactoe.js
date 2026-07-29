import {
  BOARD_SIZES,
  createEmptyBoard,
  getGameStatus,
} from '../src/utils/gameLogic.js'

const DEFAULT_SIZE = 3

/**
 * Authoritative play-room server: host = X, guest = O.
 * Room id comes from the PartyKit room URL (share code).
 */
export default class TicTacToeServer {
  constructor(room) {
    this.room = room
    this.hostId = null
    this.guestId = null
    this.everFull = false
    this.boardSize = DEFAULT_SIZE
    this.squares = createEmptyBoard(DEFAULT_SIZE)
    this.xIsNext = true
  }

  roleFor(connectionId) {
    if (connectionId === this.hostId) return 'X'
    if (connectionId === this.guestId) return 'O'
    return null
  }

  buildState(connectionId) {
    const status = getGameStatus(this.squares, this.xIsNext, this.boardSize)
    const myRole = this.roleFor(connectionId)
    const bothPresent = Boolean(this.hostId && this.guestId)

    return {
      type: 'state',
      roomId: this.room.id,
      boardSize: this.boardSize,
      squares: this.squares,
      xIsNext: this.xIsNext,
      status,
      myRole,
      hostPresent: Boolean(this.hostId),
      guestPresent: Boolean(this.guestId),
      waitingForOpponent: !bothPresent,
      opponentLeft: Boolean(myRole) && !bothPresent && this.everFull,
      canControl: connectionId === this.hostId,
    }
  }

  sendState(connection) {
    connection.send(JSON.stringify(this.buildState(connection.id)))
  }

  broadcastState() {
    for (const conn of this.room.getConnections()) {
      this.sendState(conn)
    }
  }

  onConnect(connection) {
    if (!this.hostId) {
      this.hostId = connection.id
    } else if (!this.guestId) {
      this.guestId = connection.id
    } else {
      connection.send(
        JSON.stringify({
          type: 'error',
          code: 'ROOM_FULL',
          message: 'This room already has two players.',
        }),
      )
      connection.close(4000, 'ROOM_FULL')
      return
    }

    if (this.hostId && this.guestId) {
      this.everFull = true
    }

    this.broadcastState()
  }

  onClose(connection) {
    if (connection.id === this.hostId) {
      this.hostId = null
    }
    if (connection.id === this.guestId) {
      this.guestId = null
    }
    this.broadcastState()
  }

  onError(connection) {
    this.onClose(connection)
  }

  onMessage(message, sender) {
    if (typeof message !== 'string') return

    let data
    try {
      data = JSON.parse(message)
    } catch {
      return
    }

    switch (data.type) {
      case 'move':
        this.handleMove(sender, data.index)
        break
      case 'reset':
        this.handleReset(sender)
        break
      case 'setSize':
        this.handleSetSize(sender, data.size)
        break
      default:
        break
    }
  }

  handleMove(sender, index) {
    if (!this.hostId || !this.guestId) return

    const status = getGameStatus(this.squares, this.xIsNext, this.boardSize)
    if (status.type !== 'playing') return

    const expectedRole = this.xIsNext ? 'X' : 'O'
    const senderRole = this.roleFor(sender.id)
    if (senderRole !== expectedRole) return

    if (
      typeof index !== 'number' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.squares.length
    ) {
      return
    }
    if (this.squares[index] !== null) return

    const next = this.squares.slice()
    next[index] = expectedRole
    this.squares = next
    this.xIsNext = !this.xIsNext
    this.broadcastState()
  }

  handleReset(sender) {
    if (sender.id !== this.hostId) return
    this.squares = createEmptyBoard(this.boardSize)
    this.xIsNext = true
    this.broadcastState()
  }

  handleSetSize(sender, size) {
    if (sender.id !== this.hostId) return
    if (!BOARD_SIZES.includes(size)) return
    this.boardSize = size
    this.squares = createEmptyBoard(size)
    this.xIsNext = true
    this.broadcastState()
  }
}
