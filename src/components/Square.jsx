const TEXT_STYLES = {
  3: 'text-[clamp(1.75rem,7vw,3.75rem)]',
  4: 'text-[clamp(1.4rem,5.5vw,3rem)]',
  5: 'text-[clamp(1.15rem,4.5vw,2.35rem)]',
}

export default function Square({ value, onClick, isWinning, disabled, boardSize = 3 }) {
  const playerStyles =
    value === 'X'
      ? 'text-sky-400'
      : value === 'O'
        ? 'text-rose-400'
        : 'text-transparent'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={value ? `Square ${value}` : 'Empty square'}
      className={`
        relative z-0 aspect-square w-full flex items-center justify-center rounded-xl font-bold
        transition-colors duration-200
        ${TEXT_STYLES[boardSize] ?? TEXT_STYLES[3]}
        ${playerStyles}
        ${
          isWinning
            ? 'z-[1] bg-emerald-500/25 ring-2 ring-inset ring-emerald-400'
            : 'bg-slate-800/80 hover:bg-slate-700/90'
        }
        ${disabled && !value ? 'cursor-not-allowed opacity-60' : ''}
        ${disabled && value ? 'cursor-default' : ''}
        ${!disabled ? 'cursor-pointer active:brightness-110' : ''}
      `}
    >
      {value}
    </button>
  )
}
