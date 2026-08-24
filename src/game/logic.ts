import type {
  EliminationThresholds,
  PlayerPublic,
  PlayerStats,
} from '../types'
import { emptyStats } from '../net/protocol'

/** Polish-aware word count (spaces split tokens). */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function computeStats(
  text: string,
  correctChars: number,
  elapsedMs: number,
  finishedAt: number | null,
  roundScore = 0,
): PlayerStats {
  const minutes = Math.max(elapsedMs, 1) / 60000
  const wpm = Math.round(correctChars / 5 / minutes)
  return {
    wpm: Number.isFinite(wpm) ? Math.max(0, wpm) : 0,
    correctChars,
    progress: Math.min(1, correctChars / Math.max(text.length, 1)),
    finishedAt,
    roundScore,
  }
}

/**
 * Exclusive scoring:
 * - 100 pts per correct character
 * - +5 pts per character for each opponent who has not reached that character yet
 */
export function exclusiveScores(charCounts: number[]): number[] {
  const n = charCounts.length
  return charCounts.map((chars, idx) => {
    let score = 0
    for (let i = 1; i <= chars; i++) {
      let opponentsWithout = 0
      for (let j = 0; j < n; j++) {
        if (j === idx) continue
        if ((charCounts[j] ?? 0) < i) opponentsWithout++
      }
      score += 100 + 5 * opponentsWithout
    }
    return score
  })
}

export function applyExclusiveScores(players: PlayerPublic[]): void {
  const list = [...players]
  const scores = exclusiveScores(list.map((p) => p.roundStats.correctChars))
  list.forEach((p, i) => {
    p.roundStats = { ...p.roundStats, roundScore: scores[i] ?? 0 }
  })
}

export function scoreFromStats(stats: PlayerStats): number {
  return stats.roundScore
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

/** Rank players for a scored round (higher exclusive score = better). */
export function rankPlayers(players: PlayerPublic[]): PlayerPublic[] {
  return [...players].sort((a, b) => {
    const sa = a.roundStats.roundScore
    const sb = b.roundStats.roundScore
    if (sb !== sa) return sb - sa
    if (b.roundStats.correctChars !== a.roundStats.correctChars) {
      return b.roundStats.correctChars - a.roundStats.correctChars
    }
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
): { caret: number; finished: boolean } {
  if (key.length !== 1) {
    return { caret, finished: caret >= text.length }
  }
  if (caret >= text.length) {
    return { caret, finished: true }
  }
  if (key === text[caret]) {
    const next = caret + 1
    return { caret: next, finished: next >= text.length }
  }
  // Wrong key: no progress — text must be typed correctly
  return { caret, finished: false }
}

export function resetRoundStats(players: PlayerPublic[]): void {
  for (const p of players) {
    p.roundStats = emptyStats()
  }
}
