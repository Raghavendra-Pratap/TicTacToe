#!/usr/bin/env node
/**
 * Self-hosted tic-tac-toe play rooms.
 * WS path: /play/tictactoe/:roomCode
 *
 * Seats: host (X) + guest (O).
 * Player queue (max 20): FIFO into free seats.
 * Lobby (unlimited): watch only — never auto-promoted.
 *
 * Scores:
 * - series {X,O}: head-to-head for current pairing (0–0 when a seat changes)
 * - roomWins[connectionId]: wins while this tab stays in the room
 */
import http from 'node:http'
import crypto from 'node:crypto'
import { WebSocketServer } from 'ws'
import {
  BOARD_SIZES,
  createEmptyBoard,
  getGameStatus,
} from '../src/utils/gameLogic.js'

const PORT = Number(process.env.PLAY_ROOM_PORT || 1999)
const HOST = process.env.PLAY_ROOM_HOST || '127.0.0.1'
const DEFAULT_SIZE = 3
const MAX_QUEUE = 20

class Room {
  constructor(id) {
    this.id = id
    this.hostId = null
    this.guestId = null
    /** @type {string[]} FIFO play queue */
    this.queue = []
    /** @type {string[]} watch-only lobby */
    this.lobby = []
    this.everFull = false
    this.boardSize = DEFAULT_SIZE
    this.squares = createEmptyBoard(DEFAULT_SIZE)
    this.xIsNext = true
    this.series = { X: 0, O: 0 }
    /** @type {Map<string, number>} */
    this.roomWins = new Map()
    this.lastScoredKey = null
    /** @type {Map<string, import('ws').WebSocket>} */
    this.clients = new Map()
  }

  roleFor(connectionId) {
    if (connectionId === this.hostId) return 'X'
    if (connectionId === this.guestId) return 'O'
    return null
  }

  winsFor(connectionId) {
    return this.roomWins.get(connectionId) || 0
  }

  ensureWins(connectionId) {
    if (!this.roomWins.has(connectionId)) this.roomWins.set(connectionId, 0)
  }

  maybeScoreWin() {
    const status = getGameStatus(this.squares, this.xIsNext, this.boardSize)
    if (status.type !== 'win' || !status.winner) return
    const key = `${status.winner}:${this.squares.join(',')}`
    if (this.lastScoredKey === key) return
    this.lastScoredKey = key
    this.series[status.winner] = (this.series[status.winner] || 0) + 1
    const winnerId =
      status.winner === 'X' ? this.hostId : status.winner === 'O' ? this.guestId : null
    if (winnerId) {
      this.roomWins.set(winnerId, this.winsFor(winnerId) + 1)
    }
  }

  clearBoard() {
    this.squares = createEmptyBoard(this.boardSize)
    this.xIsNext = true
    this.lastScoredKey = null
  }

  resetSeries() {
    this.series = { X: 0, O: 0 }
    this.lastScoredKey = null
  }

  removeFromLists(connectionId) {
    this.queue = this.queue.filter((id) => id !== connectionId)
    this.lobby = this.lobby.filter((id) => id !== connectionId)
  }

  buildState(connectionId) {
    this.maybeScoreWin()
    const status = getGameStatus(this.squares, this.xIsNext, this.boardSize)
    const myRole = this.roleFor(connectionId)
    const bothPresent = Boolean(this.hostId && this.guestId)
    const inQueue = this.queue.includes(connectionId)
    const inLobby = this.lobby.includes(connectionId)
    const queuePosition = inQueue ? this.queue.indexOf(connectionId) + 1 : null

    return {
      type: 'state',
      roomId: this.id,
      boardSize: this.boardSize,
      squares: this.squares,
      xIsNext: this.xIsNext,
      status,
      myRole,
      inQueue,
      inLobby,
      watchingOnly: inLobby,
      queuePosition,
      queueCount: this.queue.length,
      lobbyCount: this.lobby.length,
      queueFull: this.queue.length >= MAX_QUEUE,
      series: { ...this.series },
      /** @deprecated prefer series — kept for older clients */
      scores: { ...this.series },
      seatRoomWins: {
        X: this.hostId ? this.winsFor(this.hostId) : 0,
        O: this.guestId ? this.winsFor(this.guestId) : 0,
      },
      myRoomWins: this.winsFor(connectionId),
      hostPresent: Boolean(this.hostId),
      guestPresent: Boolean(this.guestId),
      waitingForOpponent: Boolean(myRole) && !bothPresent,
      opponentLeft: Boolean(myRole) && !bothPresent && this.everFull,
      canControl: connectionId === this.hostId,
    }
  }

  send(ws, obj) {
    if (ws.readyState === 1) ws.send(JSON.stringify(obj))
  }

  broadcast() {
    for (const [id, ws] of this.clients) {
      this.send(ws, this.buildState(id))
    }
  }

  fillSeatsFromQueue() {
    let changed = false
    while ((!this.hostId || !this.guestId) && this.queue.length > 0) {
      const nextId = this.queue.shift()
      if (!this.clients.has(nextId)) continue
      this.ensureWins(nextId)
      if (!this.hostId) this.hostId = nextId
      else if (!this.guestId) this.guestId = nextId
      changed = true
    }
    if (this.hostId && this.guestId) this.everFull = true
    if (changed) {
      this.clearBoard()
      this.resetSeries()
    }
  }

  /**
   * New connections: take a free seat, else land in lobby (watch).
   * Client opts into queue via enterQueue.
   */
  join(ws, connectionId) {
    this.clients.set(connectionId, ws)
    this.ensureWins(connectionId)

    if (!this.hostId) {
      this.hostId = connectionId
      this.resetSeries()
      this.clearBoard()
    } else if (!this.guestId) {
      this.guestId = connectionId
      this.everFull = true
      this.resetSeries()
      this.clearBoard()
    } else {
      this.lobby.push(connectionId)
    }

    this.broadcast()
    return true
  }

  /** Seat or queue → lobby (keeps roomWins). */
  moveToLobby(connectionId) {
    if (!this.clients.has(connectionId)) return

    const wasHost = connectionId === this.hostId
    const wasGuest = connectionId === this.guestId
    const wasQueued = this.queue.includes(connectionId)

    this.removeFromLists(connectionId)

    if (wasHost) this.hostId = null
    if (wasGuest) this.guestId = null

    if (!this.lobby.includes(connectionId) && this.roleFor(connectionId) == null) {
      this.lobby.push(connectionId)
    }

    if (wasHost || wasGuest) {
      this.clearBoard()
      this.resetSeries()
      this.fillSeatsFromQueue()
    } else if (wasQueued) {
      // already in lobby
    }

    this.broadcast()
  }

  /** Lobby → player queue (if space). */
  enterQueue(connectionId) {
    if (!this.clients.has(connectionId)) return
    if (this.roleFor(connectionId)) return
    if (this.queue.includes(connectionId)) return
    if (this.queue.length >= MAX_QUEUE) {
      this.broadcast()
      return
    }

    this.lobby = this.lobby.filter((id) => id !== connectionId)
    this.queue.push(connectionId)
    this.fillSeatsFromQueue()
    this.broadcast()
  }

  leave(connectionId) {
    this.clients.delete(connectionId)
    this.roomWins.delete(connectionId)
    this.removeFromLists(connectionId)

    const wasHost = connectionId === this.hostId
    const wasGuest = connectionId === this.guestId
    if (wasHost) this.hostId = null
    if (wasGuest) this.guestId = null

    if (wasHost || wasGuest) {
      this.clearBoard()
      this.resetSeries()
      this.fillSeatsFromQueue()
    }

    this.broadcast()
  }

  onMessage(connectionId, raw) {
    let data
    try {
      data = JSON.parse(String(raw))
    } catch {
      return
    }
    switch (data.type) {
      case 'move':
        this.handleMove(connectionId, data.index)
        break
      case 'reset':
        this.handleReset(connectionId)
        break
      case 'setSize':
        this.handleSetSize(connectionId, data.size)
        break
      case 'moveToLobby':
        this.moveToLobby(connectionId)
        break
      case 'enterQueue':
        this.enterQueue(connectionId)
        break
      default:
        break
    }
  }

  handleMove(connectionId, index) {
    if (!this.hostId || !this.guestId) return
    if (this.roleFor(connectionId) == null) return
    const status = getGameStatus(this.squares, this.xIsNext, this.boardSize)
    if (status.type !== 'playing') return
    const expectedRole = this.xIsNext ? 'X' : 'O'
    if (this.roleFor(connectionId) !== expectedRole) return
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
    this.broadcast()
  }

  handleReset(connectionId) {
    if (connectionId !== this.hostId) return
    this.clearBoard()
    this.broadcast()
  }

  handleSetSize(connectionId, size) {
    if (connectionId !== this.hostId) return
    if (!BOARD_SIZES.includes(size)) return
    this.boardSize = size
    this.clearBoard()
    this.broadcast()
  }
}

const rooms = new Map()

function getRoom(id) {
  const key = String(id || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (!key) return null
  if (!rooms.has(key)) rooms.set(key, new Room(key))
  return rooms.get(key)
}

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('tic-tac-toe play rooms\n')
})

const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const m = url.pathname.match(/^\/play\/tictactoe\/([A-Za-z0-9]+)$/i)
  if (!m) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n')
    socket.destroy()
    return
  }
  const room = getRoom(m[1])
  if (!room) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n')
    socket.destroy()
    return
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    const connectionId = crypto.randomUUID()
    if (!room.join(ws, connectionId)) return
    ws.on('message', (data) => room.onMessage(connectionId, data))
    ws.on('close', () => {
      room.leave(connectionId)
      if (room.clients.size === 0) rooms.delete(room.id)
    })
    ws.on('error', () => {
      room.leave(connectionId)
    })
  })
})

server.listen(PORT, HOST, () => {
  console.log(`[play-room] ws://${HOST}:${PORT}/play/tictactoe/:room`)
})
