import type {
  EliminationThresholds,
  PlayerPublic,
  PlayerStats,
} from '../types'
import { emptyStats } from '../net/protocol'

/** Polish-aware word count for WPM (spaces split tokens). */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function computeStats(
  text: string,
  correctChars: number,
  wrongChars: number,
  elapsedMs: number,
  finishedAt: number | null,
): PlayerStats {
  const minutes = Math.max(elapsedMs, 1) / 60000
  const wpm = Math.round((correctChars / 5) / minutes)
  const total = correctChars + wrongChars
  const accuracy = total === 0 ? 100 : Math.round((correctChars / total) * 100)
  return {
    wpm: Number.isFinite(wpm) ? Math.max(0, wpm) : 0,
    accuracy,
    correctChars,
    wrongChars,
    progress: Math.min(1, correctChars / Math.max(text.length, 1)),
    finishedAt,
  }
}

export function scoreFromStats(stats: PlayerStats): number {
  // Prefer finish time, then WPM, then accuracy
  const finishBonus = stats.finishedAt != null ? 10_000 - Math.min(stats.finishedAt, 9999) : 0
  return stats.correctChars * 1000 + stats.wpm * 10 + stats.accuracy + finishBonus
}

export function eliminationCount(
  activeCount: number,
  thresholds: EliminationThresholds,
): number {
  if (activeCount <= 1) return 0
  let n: number
  if (activeCount > 15) n = thresholds.above15
  else if (activeCount > 8) n = thresholds.above8
  else if (activeCount > 4) n = thresholds.above4
  else n = thresholds.atOrBelow4
  return Math.min(n, activeCount - 1)
}

export function isSingleEliminationPhase(activeCount: number): boolean {
  return activeCount <= 4
}

/** Rank players for a scored round (higher score = better). */
export function rankPlayers(players: PlayerPublic[]): PlayerPublic[] {
  return [...players].sort((a, b) => {
    const sa = scoreFromStats(a.roundStats)
    const sb = scoreFromStats(b.roundStats)
    if (sb !== sa) return sb - sa
    if (a.roundStats.finishedAt != null && b.roundStats.finishedAt != null) {
      return a.roundStats.finishedAt - b.roundStats.finishedAt
    }
    if (a.roundStats.finishedAt != null) return -1
    if (b.roundStats.finishedAt != null) return 1
    return a.nickname.localeCompare(b.nickname, 'pl')
  })
}

export function applyTypingKey(
  text: string,
  caret: number,
  key: string,
  wrongChars: number,
): { caret: number; wrongChars: number; finished: boolean } {
  if (key.length !== 1) {
    return { caret, wrongChars, finished: caret >= text.length }
  }
  if (caret >= text.length) {
    return { caret, wrongChars, finished: true }
  }
  if (key === text[caret]) {
    const next = caret + 1
    return { caret: next, wrongChars, finished: next >= text.length }
  }
  return { caret, wrongChars: wrongChars + 1, finished: false }
}

export function resetRoundStats(players: PlayerPublic[]): void {
  for (const p of players) {
    p.roundStats = emptyStats()
  }
}
