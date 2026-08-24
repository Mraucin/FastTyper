export type Role = 'host' | 'player'

export type Screen =
  | 'home'
  | 'host-lobby'
  | 'join'
  | 'player-lobby'
  | 'countdown'
  | 'race'
  | 'round-results'
  | 'final'
  | 'error'

export interface EliminationThresholds {
  /** Eliminate this many when active players > 15 */
  above15: number
  /** Eliminate this many when active players > 8 */
  above8: number
  /** Eliminate this many when active players > 4 */
  above4: number
  /** Eliminate this many when active players <= 4 */
  atOrBelow4: number
}

export const DEFAULT_THRESHOLDS: EliminationThresholds = {
  above15: 4,
  above8: 3,
  above4: 2,
  atOrBelow4: 1,
}

export interface PlayerStats {
  wpm: number
  accuracy: number
  correctChars: number
  wrongChars: number
  progress: number
  finishedAt: number | null
}

export interface PlayerPublic {
  id: string
  nickname: string
  color: string
  connected: boolean
  eliminated: boolean
  eliminatedRound: number | null
  /** Can type to improve score until single-elim phase */
  canType: boolean
  spectating: boolean
  totalScore: number
  roundStats: PlayerStats
  place: number | null
}

export interface RoundCheckpoint {
  totalScore: number
  eliminated: boolean
  eliminatedRound: number | null
  canType: boolean
  spectating: boolean
}

export interface GameSettings {
  thresholds: EliminationThresholds
  roundSeconds: number
}

export interface RoomSnapshot {
  code: string
  phase:
    | 'lobby'
    | 'countdown'
    | 'racing'
    | 'round-results'
    | 'final'
  roundIndex: number
  isPractice: boolean
  singleElimStarted: boolean
  text: string
  textId: string
  roundEndsAt: number | null
  countdownEndsAt: number | null
  players: PlayerPublic[]
  settings: GameSettings
  winnerId: string | null
}

export const MAX_PLAYERS = 30
export const ROUND_SECONDS = 60
export const COUNTDOWN_SECONDS = 3
export const PEER_PREFIX = 'ftyper-'
