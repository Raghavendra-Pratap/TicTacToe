import { BOARD_SIZES } from '../utils/gameLogic'

export default function BoardSizeSelector({ size, onChange, disabled }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-slate-400 sm:text-base">Board size</span>
      <div
        className="inline-flex rounded-lg bg-slate-800/80 p-1"
        role="group"
        aria-label="Board size"
      >
        {BOARD_SIZES.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            aria-pressed={size === option}
            className={`
              min-w-[3.75rem] rounded-md px-4 py-2.5 text-sm font-semibold transition sm:min-w-[4.25rem] sm:px-5 sm:text-base
              ${size === option
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'}
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
            `}
          >
            {option}×{option}
          </button>
        ))}
      </div>
    </div>
  )
}
