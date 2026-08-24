const NICK_KEY = 'fasttyper-nickname'
const PLAYER_ID_KEY = 'fasttyper-player-id'

export function getCachedNickname(): string {
  return localStorage.getItem(NICK_KEY) ?? ''
}

export function setCachedNickname(nickname: string): void {
  localStorage.setItem(NICK_KEY, nickname.trim())
}

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(PLAYER_ID_KEY, id)
  }
  return id
}
