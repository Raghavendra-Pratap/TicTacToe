import { useEffect, useId, useState } from 'react'
import { inviteUrlFor, normalizeRoomCode } from '../online/roomCode'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return isMobile
}

export default function RoomPanel({
  online,
  roomCode,
  myRole,
  waitingForOpponent,
  opponentLeft,
  connected,
  error,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const titleId = useId()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open) return undefined

    function onKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    if (isMobile) document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, isMobile])

  function handleJoin(event) {
    event.preventDefault()
    const normalized = normalizeRoomCode(code)
    if (normalized.length < 4) return
    onJoinRoom(normalized)
    setCode('')
  }

  async function copyInvite() {
    const invite = inviteUrlFor(roomCode)
    try {
      await navigator.clipboard.writeText(invite)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this invite link:', invite)
    }
  }

  function leave() {
    onLeaveRoom()
    setOpen(false)
  }

  const panelBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id={titleId}
            className="text-sm font-semibold uppercase tracking-wide text-slate-400"
          >
            Play room
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Invite a friend online, or keep playing locally.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Close play room"
        >
          ✕
        </button>
      </div>

      {online ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs text-slate-500">Room code</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-[0.25em] text-white">
              {roomCode}
            </p>
          </div>

          {myRole && (
            <p className="text-sm text-slate-300">
              You are{' '}
              <span
                className={`font-bold ${myRole === 'X' ? 'text-sky-400' : 'text-rose-400'}`}
              >
                {myRole}
              </span>
              {myRole === 'X' ? ' (host)' : ' (guest)'}
            </p>
          )}

          {!connected && !error && (
            <p className="text-sm text-amber-400" role="status">
              Connecting…
            </p>
          )}

          {error && (
            <p className="text-sm text-rose-400" role="alert">
              {error}
            </p>
          )}

          {connected && waitingForOpponent && !error && (
            <p className="text-sm text-amber-400" role="status">
              {opponentLeft
                ? 'Opponent left — waiting to rejoin…'
                : 'Waiting for opponent…'}
            </p>
          )}

          {connected && !waitingForOpponent && !error && (
            <p className="text-sm text-emerald-400" role="status">
              Opponent connected
            </p>
          )}

          <button
            type="button"
            onClick={copyInvite}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>

          <button
            type="button"
            onClick={leave}
            className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            Leave room · play locally
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={onCreateRoom}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
          >
            Create room
          </button>

          <form onSubmit={handleJoin} className="space-y-2">
            <label className="block text-xs font-medium text-slate-500">
              Join with code
            </label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={8}
                className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm tracking-widest text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="Room code"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )

  return (
    <div className="relative pointer-events-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="play-room-panel"
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900/90 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 ring-1 ring-slate-700 backdrop-blur transition hover:bg-slate-800"
      >
        <span>Play room</span>
        {online && (
          <span className="rounded bg-indigo-600/30 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-indigo-300">
            {roomCode}
          </span>
        )}
      </button>

      {open &&
        (isMobile ? (
          <div className="fixed inset-0 z-40">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Close play room overlay"
              onClick={() => setOpen(false)}
            />
            <div
              id="play-room-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="absolute left-1/2 top-1/2 w-[min(100%-2rem,22rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-900 p-4 shadow-2xl ring-1 ring-slate-700"
            >
              {panelBody}
            </div>
          </div>
        ) : (
          <aside
            id="play-room-panel"
            className="absolute left-0 top-12 z-30 w-64 rounded-xl bg-slate-900/95 p-4 shadow-xl shadow-black/30 ring-1 ring-slate-800 backdrop-blur"
          >
            {panelBody}
          </aside>
        ))}
    </div>
  )
}
