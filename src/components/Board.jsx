import Square from './Square'

const GAP_STYLES = {
  3: 'gap-2.5 sm:gap-3 md:gap-4',
  4: 'gap-2 sm:gap-2.5 md:gap-3',
  5: 'gap-1.5 sm:gap-2 md:gap-2.5',
}

const WIDTH_STYLES = {
  3: 'w-[min(92vw,28rem)] sm:w-[min(88vw,34rem)] lg:w-[min(70vw,38rem)]',
  4: 'w-[min(94vw,30rem)] sm:w-[min(90vw,38rem)] lg:w-[min(72vw,42rem)]',
  5: 'w-[min(96vw,32rem)] sm:w-[min(92vw,42rem)] lg:w-[min(75vw,46rem)]',
}

export default function Board({ squares, onPlay, winningLine, gameOver, size }) {
  return (
    <div className={`${WIDTH_STYLES[size] ?? WIDTH_STYLES[3]}`}>
    <div
      className={`grid ${GAP_STYLES[size] ?? 'gap-2'}`}
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      role="grid"
      aria-label={`${size} by ${size} tic tac toe board`}
    >
      {squares.map((value, index) => (
        <Square
          key={index}
          value={value}
          onClick={() => onPlay(index)}
          isWinning={winningLine?.includes(index)}
          disabled={gameOver || value !== null}
          boardSize={size}
        />
      ))}
    </div>
    </div>
  )
}
