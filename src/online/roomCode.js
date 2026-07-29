const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return code
}

export function normalizeRoomCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function readRoomFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return normalizeRoomCode(params.get('room'))
}

export function writeRoomToUrl(code) {
  const url = new URL(window.location.href)
  if (code) {
    url.searchParams.set('room', code)
  } else {
    url.searchParams.delete('room')
  }
  window.history.replaceState({}, '', url)
}

export function inviteUrlFor(code) {
  const url = new URL(window.location.href)
  url.searchParams.set('room', code)
  return url.toString()
}

export function partyHost() {
  return import.meta.env.VITE_PARTYKIT_HOST || '127.0.0.1:1999'
}
