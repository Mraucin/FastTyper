import type {
  EliminationThresholds,
  GameSettings,
  PlayerPublic,
  PlayerStats,
  RoomSnapshot,
} from '../types'

export type ClientToHost =
  | {
      type: 'join'
      playerId: string
      nickname: string
      reconnect?: boolean
    }
  | { type: 'leave'; playerId: string }
  | {
      type: 'progress'
      playerId: string
      stats: PlayerStats
    }
  | { type: 'ping'; playerId: string }

export type HostToClient =
  | { type: 'welcome'; you: PlayerPublic; snapshot: RoomSnapshot }
  | { type: 'error'; message: string }
  | { type: 'snapshot'; snapshot: RoomSnapshot }
  | { type: 'kicked'; reason: string }

export function emptyStats(): PlayerStats {
  return {
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    wrongChars: 0,
    progress: 0,
    finishedAt: null,
  }
}

export function createRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function peerIdForCode(code: string): string {
  return `ftyper-${code.toUpperCase()}`
}

export function defaultSettings(
  thresholds?: Partial<EliminationThresholds>,
): GameSettings {
  return {
    roundSeconds: 60,
    thresholds: {
      above15: thresholds?.above15 ?? 4,
      above8: thresholds?.above8 ?? 3,
      above4: thresholds?.above4 ?? 2,
      atOrBelow4: thresholds?.atOrBelow4 ?? 1,
    },
  }
}

export const PLAYER_COLORS = [
  '#e85d4c',
  '#2a9d8f',
  '#e9c46a',
  '#4a6fa5',
  '#c77dff',
  '#f4a261',
  '#2ec4b6',
  '#ef476f',
  '#06d6a0',
  '#118ab2',
  '#ffd166',
  '#073b4c',
  '#9b5de5',
  '#00bbf9',
  '#fee440',
  '#f15bb5',
  '#00f5d4',
  '#fb5607',
  '#3a86ff',
  '#8338ec',
  '#ff006e',
  '#8ac926',
  '#1982c4',
  '#ff595e',
  '#6a4c93',
  '#1982c4',
  '#ffca3a',
  '#8d99ae',
  '#2b2d42',
  '#d90429',
]
