export default function StatusBanner({ status, boardSize }) {
  if (status.type === 'win') {
    return (
      <div className="space-y-1 text-center" role="status" aria-live="polite">
        <p className="text-xl font-semibold text-emerald-400 sm:text-2xl">
          <span className={status.winner === 'X' ? 'text-sky-400' : 'text-rose-400'}>
            {status.winner}
          </span>{' '}
          wins!
        </p>
        <p className="text-sm text-slate-500">
          {boardSize} in a row on {boardSize}×{boardSize}
        </p>
      </div>
    )
  }

  if (status.type === 'draw') {
    return (
      <p
        className="text-center text-xl font-semibold text-amber-400 sm:text-2xl"
        role="status"
        aria-live="polite"
      >
        It&apos;s a draw!
      </p>
    )
  }

  return (
    <div className="space-y-1 text-center" role="status">
      <p className="text-xl text-slate-300 sm:text-2xl">
        Current turn:{' '}
        <span
          className={`font-bold ${status.currentPlayer === 'X' ? 'text-sky-400' : 'text-rose-400'}`}
        >
          {status.currentPlayer}
        </span>
      </p>
      <p className="text-sm text-slate-500">
        First to get {boardSize} in a row wins
      </p>
    </div>
  )
}
