const fs = require('fs')
const selected = JSON.parse(
  fs.readFileSync('C:/Users/mrauc/Documents/FastTyper/scripts/fragments-raw.json', 'utf8'),
)

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

let out = ''
out += `export interface Passage {
  id: string
  title: string
  source: string
  text: string
  /** Difficulty level 1–9 (word-count bands) */
  level: number
  wordCount: number
}

export const MAX_DIFFICULTY_LEVEL = 9

/** Word-count bands: level L covers (5L+1)–(5L+5) words */
export function levelWordRange(level: number): { min: number; max: number } {
  return { min: 5 * level + 1, max: 5 * level + 5 }
}

/** Fragments from Janusz Korczak — Król Maciuś Pierwszy (Wolne Lektury). Only letters, spaces, period, comma. */
export const PASSAGES: Passage[] = [
`

selected.forEach((p, i) => {
  const id = `km-${String(i + 1).padStart(3, '0')}-l${p.level}`
  out += `  {
    id: '${id}',
    title: 'Król Maciuś Pierwszy',
    source: 'Janusz Korczak / Wolne Lektury',
    text: '${esc(p.text)}',
    level: ${p.level},
    wordCount: ${p.words},
  },
`
})

out += `]

export function passagesForLevel(level: number): Passage[] {
  const clamped = Math.max(1, Math.min(MAX_DIFFICULTY_LEVEL, level))
  const pool = PASSAGES.filter((p) => p.level === clamped)
  return pool.length > 0 ? pool : PASSAGES.filter((p) => p.level === 1)
}

export function pickPassage(level: number, excludeIds: string[] = []): Passage {
  const pool = passagesForLevel(level)
  const available = pool.filter((p) => !excludeIds.includes(p.id))
  const use = available.length > 0 ? available : pool
  return use[Math.floor(Math.random() * use.length)]!
}
`

fs.writeFileSync('C:/Users/mrauc/Documents/FastTyper/src/data/texts.ts', out)
console.log('wrote', selected.length, 'passages')
