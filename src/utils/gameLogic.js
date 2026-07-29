export const BOARD_SIZES = [3, 4, 5]

export function createEmptyBoard(size) {
  return Array(size * size).fill(null)
}

function checkLine(squares, indices) {
  const first = squares[indices[0]]
  if (!first) return false
  return indices.every((i) => squares[i] === first)
}

export function calculateWinner(squares, size) {
  const winLength = size

  const tryLine = (indices) => {
    if (checkLine(squares, indices)) {
      return { winner: squares[indices[0]], line: indices }
    }
    return null
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const indices = Array.from({ length: winLength }, (_, i) => row * size + col + i)
      const result = tryLine(indices)
      if (result) return result
    }
  }

  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLength; row++) {
      const indices = Array.from({ length: winLength }, (_, i) => (row + i) * size + col)
      const result = tryLine(indices)
      if (result) return result
    }
  }

  for (let row = 0; row <= size - winLength; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const indices = Array.from(
        { length: winLength },
        (_, i) => (row + i) * size + col + i,
      )
      const result = tryLine(indices)
      if (result) return result
    }
  }

  for (let row = 0; row <= size - winLength; row++) {
    for (let col = winLength - 1; col < size; col++) {
      const indices = Array.from(
        { length: winLength },
        (_, i) => (row + i) * size + col - i,
      )
      const result = tryLine(indices)
      if (result) return result
    }
  }

  return null
}

export function isBoardFull(squares) {
  return squares.every((square) => square !== null)
}

export function getGameStatus(squares, xIsNext, size) {
  const result = calculateWinner(squares, size)
  if (result) {
    return { type: 'win', winner: result.winner, line: result.line }
  }
  if (isBoardFull(squares)) {
    return { type: 'draw' }
  }
  return { type: 'playing', currentPlayer: xIsNext ? 'X' : 'O' }
}
