import { webcrypto } from 'node:crypto'
import { createRequire } from 'node:module'
globalThis.crypto = webcrypto

const require = createRequire(import.meta.url)
const WS = require('ws')
const PartySocket = (await import('partysocket')).default

const room = 'TEST01'
const a = new PartySocket({ host: '127.0.0.1:1999', room, party: 'main', WebSocket: WS, id: 'host-a' })
const b = new PartySocket({ host: '127.0.0.1:1999', room, party: 'main', WebSocket: WS, id: 'guest-b' })

function once(socket, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label + ' timeout')), 8000)
    socket.addEventListener('message', (e) => {
      clearTimeout(t)
      resolve(JSON.parse(e.data))
    })
    socket.addEventListener('error', (e) => {
      clearTimeout(t)
      reject(e.error || new Error(label + ' error'))
    })
  })
}

try {
  const [sa, sb] = await Promise.all([once(a, 'a'), once(b, 'b')])
  console.log('A role', sa.myRole, 'waiting', sa.waitingForOpponent)
  console.log('B role', sb.myRole, 'waiting', sb.waitingForOpponent)

  const afterMove = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('move timeout')), 5000)
    b.addEventListener('message', (e) => {
      const d = JSON.parse(e.data)
      if (d.squares && d.squares[0] === 'X') {
        clearTimeout(t)
        resolve(d)
      }
    })
  })
  a.send(JSON.stringify({ type: 'move', index: 0 }))
  const moved = await afterMove
  console.log('move ok', moved.squares.slice(0, 3), 'current', moved.status)
} catch (err) {
  console.error('FAIL', err)
  process.exitCode = 1
} finally {
  a.close()
  b.close()
  setTimeout(() => process.exit(process.exitCode || 0), 200)
}
