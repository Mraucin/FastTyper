import './style.css'
import { pickPassage } from './data/texts'
import { computeStats, applyTypingKey, exclusiveScores } from './game/logic'
import { ClientSession } from './net/client'
import { HostSession, createHost } from './net/host'
import { getCachedNickname, getOrCreatePlayerId, setCachedNickname } from './storage'
import type { EliminationThresholds, PlayerPublic, RoomSnapshot, Screen } from './types'
import { COUNTDOWN_SECONDS, DEFAULT_THRESHOLDS, MAX_PLAYERS, ROUND_SECONDS } from './types'

type Mode = 'none' | 'host' | 'player' | 'train'

interface TrainState {
  text: string
  title: string
  source: string
  phase: 'countdown' | 'racing' | 'results'
  countdownEndsAt: number | null
  roundEndsAt: number | null
  usedIds: string[]
  resultChars: number
  resultWpm: number
  resultScore: number
}

interface AppState {
  screen: Screen
  mode: Mode
  error: string | null
  host: HostSession | null
  client: ClientSession | null
  snapshot: RoomSnapshot | null
  you: PlayerPublic | null
  thresholds: EliminationThresholds
  joinCode: string
  nickname: string
  train: TrainState | null
  /** Local typing state for player */
  caret: number
  raceStartedAt: number | null
  finishedAt: number | null
  lastKeyWrong: boolean
}

const app = document.querySelector<HTMLDivElement>('#app')!

const state: AppState = {
  screen: 'home',
  mode: 'none',
  error: null,
  host: null,
  client: null,
  snapshot: null,
  you: null,
  thresholds: { ...DEFAULT_THRESHOLDS },
  joinCode: '',
  nickname: getCachedNickname(),
  train: null,
  caret: 0,
  raceStartedAt: null,
  finishedAt: null,
  lastKeyWrong: false,
}

let unsubHost: (() => void) | null = null
let unsubClient: (() => void) | null = null
let unsubClientErr: (() => void) | null = null
let progressInterval: number | null = null
let clockInterval: number | null = null
let trainTimers: number[] = []

function setError(msg: string | null): void {
  state.error = msg
  render()
}

function resetTyping(): void {
  state.caret = 0
  state.raceStartedAt = null
  state.finishedAt = null
  state.lastKeyWrong = false
}

function clearTrainTimers(): void {
  for (const t of trainTimers) window.clearTimeout(t)
  trainTimers = []
}

function clearSessions(): void {
  if (unsubHost) unsubHost()
  if (unsubClient) unsubClient()
  if (unsubClientErr) unsubClientErr()
  unsubHost = unsubClient = unsubClientErr = null
  if (progressInterval != null) window.clearInterval(progressInterval)
  if (clockInterval != null) window.clearInterval(clockInterval)
  progressInterval = clockInterval = null
  clearTrainTimers()
  state.host?.destroy()
  state.client?.destroy()
  state.host = null
  state.client = null
  state.snapshot = null
  state.you = null
  state.train = null
  state.mode = 'none'
  resetTyping()
}

function syncPhaseFromSnapshot(snap: RoomSnapshot): void {
  const prevPhase = state.snapshot?.phase
  const prevRound = state.snapshot?.roundIndex
  const prevText = state.snapshot?.text
  state.snapshot = snap

  if (snap.phase === 'lobby') state.screen = state.mode === 'host' ? 'host-lobby' : 'player-lobby'
  else if (snap.phase === 'countdown') {
    state.screen = 'countdown'
    ensureClock()
    if (prevPhase !== 'countdown' || prevRound !== snap.roundIndex) resetTyping()
  } else if (snap.phase === 'racing') {
    state.screen = 'race'
    ensureClock()
    if (prevPhase !== 'racing' || state.raceStartedAt == null) {
      if (prevPhase !== 'racing') resetTyping()
      state.raceStartedAt = Date.now()
      startProgressLoop()
    }
  } else if (snap.phase === 'round-results') {
    state.screen = 'round-results'
    stopProgressLoop()
  } else if (snap.phase === 'final') {
    state.screen = 'final'
    stopProgressLoop()
  }

  // Avoid full DOM rebuild on every progress tick during race
  if (
    snap.phase === 'racing' &&
    prevPhase === 'racing' &&
    prevText === snap.text &&
    state.screen === 'race'
  ) {
    updateRaceLiveDom(snap)
    return
  }
}

function startProgressLoop(): void {
  if (progressInterval != null) window.clearInterval(progressInterval)
  progressInterval = window.setInterval(() => {
    if (state.mode === 'player' && state.client && state.snapshot?.phase === 'racing') {
      pushProgress()
    }
    if (
      state.screen === 'race' ||
      state.screen === 'countdown' ||
      state.screen === 'train-race' ||
      state.screen === 'train-countdown'
    ) {
      updateClockDom()
      if (state.mode === 'train' && state.screen === 'train-race') {
        updateLocalStatsDom()
      }
    }
  }, 200)
}

function ensureClock(): void {
  if (clockInterval != null) return
  clockInterval = window.setInterval(() => {
    if (
      state.screen === 'race' ||
      state.screen === 'countdown' ||
      state.screen === 'train-race' ||
      state.screen === 'train-countdown'
    ) {
      updateClockDom()
    }
  }, 200)
}

function stopProgressLoop(): void {
  if (progressInterval != null) window.clearInterval(progressInterval)
  progressInterval = null
}

function currentStats() {
  const text =
    state.mode === 'train' ? (state.train?.text ?? '') : (state.snapshot?.text ?? '')
  const started = state.raceStartedAt ?? Date.now()
  const elapsed = Date.now() - started
  const soloScore = exclusiveScores([state.caret])[0] ?? 0
  const liveScore =
    state.mode === 'train' ? soloScore : (state.you?.roundStats.roundScore ?? soloScore)
  return computeStats(text, state.caret, elapsed, state.finishedAt, liveScore)
}

function pushProgress(): void {
  if (state.mode === 'train') return
  if (!state.you?.canType || state.you.spectating) return
  state.client?.sendProgress(currentStats())
}

function canPlayerType(): boolean {
  if (state.mode === 'train') {
    return state.train?.phase === 'racing'
  }
  if (state.mode !== 'player') return false
  const you = state.you
  if (!you) return false
  if (you.spectating || !you.canType) return false
  return state.snapshot?.phase === 'racing'
}

function onKeyDown(e: KeyboardEvent): void {
  if (!canPlayerType()) return
  const text =
    state.mode === 'train' ? (state.train?.text ?? '') : (state.snapshot?.text ?? '')
  if (!text) return

  if (e.key === 'Backspace') {
    e.preventDefault()
    return
  }

  if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
  e.preventDefault()

  if (state.raceStartedAt == null) state.raceStartedAt = Date.now()

  const before = state.caret
  const result = applyTypingKey(text, state.caret, e.key)
  state.caret = result.caret
  state.lastKeyWrong = result.caret === before && e.key !== text[before]
  if (result.finished && state.finishedAt == null) {
    state.finishedAt = Date.now() - (state.raceStartedAt ?? Date.now())
  }
  pushProgress()
  renderPassageOnly()
  updateLocalStatsDom()

  if (state.mode === 'train' && result.finished) {
    endTrainRace()
  }
}

document.addEventListener('keydown', onKeyDown)

function startTrainRound(continueSession = false): void {
  const used = continueSession && state.train ? [...state.train.usedIds] : []
  clearTrainTimers()
  stopProgressLoop()

  // Leave any multiplayer session without wiping train used-ids we already copied
  if (unsubHost) unsubHost()
  if (unsubClient) unsubClient()
  if (unsubClientErr) unsubClientErr()
  unsubHost = unsubClient = unsubClientErr = null
  state.host?.destroy()
  state.client?.destroy()
  state.host = null
  state.client = null
  state.snapshot = null
  state.you = null

  const passage = pickPassage(used)
  used.push(passage.id)

  state.mode = 'train'
  state.error = null
  resetTyping()
  state.train = {
    text: passage.text,
    title: passage.title,
    source: passage.source,
    phase: 'countdown',
    countdownEndsAt: Date.now() + COUNTDOWN_SECONDS * 1000,
    roundEndsAt: null,
    usedIds: used,
    resultChars: 0,
    resultWpm: 0,
    resultScore: 0,
  }
  state.screen = 'train-countdown'
  ensureClock()
  render()

  const t1 = window.setTimeout(() => {
    if (!state.train || state.mode !== 'train') return
    state.train.phase = 'racing'
    state.train.countdownEndsAt = null
    state.train.roundEndsAt = Date.now() + ROUND_SECONDS * 1000
    state.screen = 'train-race'
    state.raceStartedAt = Date.now()
    startProgressLoop()
    render()

    const t2 = window.setTimeout(() => endTrainRace(), ROUND_SECONDS * 1000)
    trainTimers.push(t2)
  }, COUNTDOWN_SECONDS * 1000)
  trainTimers.push(t1)
}

function endTrainRace(): void {
  if (!state.train || state.train.phase === 'results') return
  clearTrainTimers()
  stopProgressLoop()
  const stats = currentStats()
  const score = exclusiveScores([state.caret])[0] ?? 0
  state.train.phase = 'results'
  state.train.roundEndsAt = null
  state.train.resultChars = state.caret
  state.train.resultWpm = stats.wpm
  state.train.resultScore = score
  state.screen = 'train-results'
  render()
}

async function startHost(): Promise<void> {
  clearSessions()
  state.mode = 'host'
  state.error = null
  state.screen = 'host-lobby'
  render()
  try {
    const host = createHost(state.thresholds)
    state.host = host
    await host.start()
    unsubHost = host.onSnapshot((snap) => {
      const phaseChanged = state.snapshot?.phase !== snap.phase
      syncPhaseFromSnapshot(snap)
      if (snap.phase !== 'racing' || phaseChanged || state.screen !== 'race') {
        render()
      }
    })
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Nie udało się utworzyć pokoju.')
    state.screen = 'home'
    state.mode = 'none'
    render()
  }
}

async function joinRoom(reconnect = false): Promise<void> {
  const nick = state.nickname.trim()
  const code = state.joinCode.trim().toUpperCase()
  if (!nick) {
    setError('Podaj nickname.')
    return
  }
  if (code.length < 4) {
    setError('Podaj 4-znakowy kod pokoju.')
    return
  }

  setCachedNickname(nick)
  clearSessions()
  state.mode = 'player'
  state.nickname = nick
  state.joinCode = code
  state.error = null
  state.screen = 'player-lobby'
  render()

  try {
    const client = new ClientSession(getOrCreatePlayerId(), nick)
    state.client = client
    unsubClientErr = client.onError((msg) => {
      setError(msg)
    })
    unsubClient = client.onSnapshot((snap, you) => {
      state.you = you
      const phaseChanged = state.snapshot?.phase !== snap.phase
      syncPhaseFromSnapshot(snap)
      if (snap.phase !== 'racing' || phaseChanged || state.screen !== 'race') {
        render()
      }
    })
    await client.connect(code, reconnect)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Dołączanie nieudane.')
    state.screen = 'join'
    state.mode = 'none'
    render()
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatTimeLeft(endsAt: number | null): string {
  if (endsAt == null) return '—'
  const ms = Math.max(0, endsAt - Date.now())
  const s = Math.ceil(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function playerListHtml(players: PlayerPublic[], opts?: { showStats?: boolean }): string {
  if (players.length === 0) {
    return `<p class="hint">Brak graczy — podziel się kodem pokoju.</p>`
  }
  return `<ul class="player-list">${players
    .map((p) => {
      const badges: string[] = []
      if (!p.connected) badges.push(`<span class="badge dc">offline</span>`)
      if (p.eliminated) badges.push(`<span class="badge out">out</span>`)
      if (p.spectating) badges.push(`<span class="badge">widz</span>`)
      const stats = opts?.showStats
        ? `<span class="muted">${p.roundStats.roundScore} pkt · ${p.roundStats.correctChars} zn.</span>`
        : `<span class="muted">${p.roundStats.roundScore} pkt</span>`
      return `<li>
        <span class="swatch" style="background:${p.color}"></span>
        <span>${escapeHtml(p.nickname)} ${badges.join(' ')}</span>
        ${stats}
      </li>`
    })
    .join('')}</ul>`
}

function flagsLayerHtml(snap: RoomSnapshot): string {
  const flags = snap.players
    .filter((p) => p.canType || !p.eliminated)
    .map((p) => {
      const left = Math.min(100, Math.max(0, p.roundStats.progress * 100))
      const initials = p.nickname.slice(0, 2).toUpperCase()
      return `<span class="flag" style="left:${left}%;background:${p.color}" title="${escapeHtml(p.nickname)}">${escapeHtml(initials)}</span>`
    })
    .join('')
  return `<div class="flags-layer" aria-hidden="true">${flags}</div>`
}

function passageHtml(text: string, caret: number, showLocalCaret: boolean): string {
  if (!showLocalCaret) {
    return `<div class="passage"><span class="todo">${escapeHtml(text)}</span></div>`
  }
  const done = escapeHtml(text.slice(0, caret))
  const cur = escapeHtml(text[caret] ?? '')
  const todo = escapeHtml(text.slice(caret + (text[caret] != null ? 1 : 0)))
  const curClass = state.lastKeyWrong ? 'current wrong' : 'current'
  return `<div class="passage"><span class="done">${done}</span>${
    caret < text.length ? `<span class="${curClass}">${cur || '&nbsp;'}</span>` : ''
  }<span class="todo">${todo}</span></div>`
}

function hostPassageHtml(snap: RoomSnapshot): string {
  return `<div class="passage"><span class="todo">${escapeHtml(snap.text)}</span></div>`
}

function threshForm(t: EliminationThresholds, editable: boolean): string {
  const dis = editable ? '' : 'disabled'
  return `<div class="thresh-grid">
    <div class="field">
      <label>&gt;15 graczy — eliminuj</label>
      <input type="number" min="1" max="10" data-th="above15" value="${t.above15}" ${dis} />
    </div>
    <div class="field">
      <label>&gt;8 graczy — eliminuj</label>
      <input type="number" min="1" max="10" data-th="above8" value="${t.above8}" ${dis} />
    </div>
    <div class="field">
      <label>&gt;4 graczy — eliminuj</label>
      <input type="number" min="1" max="10" data-th="above4" value="${t.above4}" ${dis} />
    </div>
    <div class="field">
      <label>≤4 graczy — eliminuj</label>
      <input type="number" min="1" max="3" data-th="atOrBelow4" value="${t.atOrBelow4}" ${dis} />
    </div>
  </div>`
}

function roundLabel(snap: RoomSnapshot): string {
  if (snap.phase === 'final') return 'Koniec meczu'
  if (snap.isPractice) {
    return snap.phase === 'round-results'
      ? 'Koniec rundy testowej'
      : 'Runda testowa (nie liczy się)'
  }
  if (snap.phase === 'round-results') return `Koniec rundy ${snap.roundIndex}`
  return `Runda ${Math.max(1, snap.roundIndex)}`
}

function rankedForRound(snap: RoomSnapshot): PlayerPublic[] {
  return [...snap.players].sort((a, b) => {
    if (b.roundStats.roundScore !== a.roundStats.roundScore) {
      return b.roundStats.roundScore - a.roundStats.roundScore
    }
    return b.roundStats.correctChars - a.roundStats.correctChars
  })
}

function finalRows(snap: RoomSnapshot): PlayerPublic[] {
  return [...snap.players].sort((a, b) => (a.place ?? 999) - (b.place ?? 999))
}

function errorBanner(): string {
  return state.error ? `<div class="error-banner">${escapeHtml(state.error)}</div>` : ''
}

function renderHome(): string {
  return `<div class="screen hero">
    <h1 class="brand">Fast<em>Typer</em></h1>
    <p class="tagline">Wieloosobowa gra w szybkie pisanie na tekstach z polskiej kultury. Host tworzy pokój, gracze dołączają kodem — battle royale do ostatniego ocalałego.</p>
    ${errorBanner()}
    <div class="actions">
      <button type="button" data-action="goto-train">Trening</button>
      <button type="button" data-action="goto-host">Utwórz pokój (host)</button>
      <button type="button" class="secondary" data-action="goto-join">Dołącz z kodem</button>
    </div>
    <p class="footer-note">Trening działa offline. Multiplayer: PeerJS, max ${MAX_PLAYERS} graczy — GitHub Pages.</p>
  </div>`
}

function renderHostLobby(snap: RoomSnapshot | null): string {
  const code = snap?.code ?? '····'
  const players = snap?.players ?? []
  const t = snap?.settings.thresholds ?? state.thresholds
  return `<div class="screen">
    <div class="status-bar">
      <h1 class="brand" style="font-size:2.4rem;margin:0">Fast<em>Typer</em></h1>
      <span class="badge">HOST</span>
    </div>
    ${errorBanner()}
    <div class="grid-2">
      <div class="panel">
        <h2>Kod pokoju</h2>
        <p class="room-code">${escapeHtml(code)}</p>
        <p class="hint">Gracze otwierają tę samą stronę, wybierają „Dołącz” i wpisują kod oraz nickname. Do startu potrzeba min. 2 graczy.</p>
        <div class="actions" style="margin-top:1.25rem">
          <button type="button" data-action="start-match" ${players.length < 2 ? 'disabled' : ''}>Start meczu</button>
          <button type="button" class="secondary" data-action="home">Zamknij pokój</button>
        </div>
      </div>
      <div class="panel">
        <h2>Gracze (${players.length}/${MAX_PLAYERS})</h2>
        ${playerListHtml(players)}
      </div>
    </div>
    <div class="panel" style="margin-top:1rem">
      <h3>Progi eliminacji (battle royale)</h3>
      <p class="hint">Pierwsza runda jest testowa i nie eliminuje. Potem odpada najsłabszych według progów.</p>
      ${threshForm(t, true)}
    </div>
  </div>`
}

function renderJoin(): string {
  return `<div class="screen">
    <h1 class="brand" style="font-size:2.6rem">Dołącz</h1>
    <p class="tagline">Wpisz kod od hosta i swój nickname.</p>
    ${errorBanner()}
    <div class="panel" style="max-width:28rem">
      <div class="field">
        <label>Kod pokoju</label>
        <input type="text" data-field="joinCode" maxlength="6" value="${escapeHtml(state.joinCode)}" placeholder="ABCD" autocomplete="off" />
      </div>
      <div class="field">
        <label>Nickname</label>
        <input type="text" data-field="nickname" maxlength="20" value="${escapeHtml(state.nickname)}" placeholder="Twój nick" />
      </div>
      <div class="actions">
        <button type="button" data-action="join">Dołącz</button>
        <button type="button" class="secondary" data-action="reconnect">Ponowne dołączenie</button>
        <button type="button" class="secondary" data-action="home">Wróć</button>
      </div>
      <p class="hint" style="margin-top:1rem">Nickname zapisywany jest w pamięci przeglądarki. Przy zerwaniu połączenia użyj „Ponowne dołączenie”, by odtworzyć stan sprzed rundy.</p>
    </div>
  </div>`
}

function renderPlayerLobby(snap: RoomSnapshot | null): string {
  const players = snap?.players ?? []
  return `<div class="screen">
    <div class="status-bar">
      <h1 class="brand" style="font-size:2.2rem;margin:0">Fast<em>Typer</em></h1>
      <span class="badge">POKÓJ ${escapeHtml(snap?.code ?? '')}</span>
    </div>
    ${errorBanner()}
    <div class="panel">
      <h2>Czekasz na start</h2>
      <p class="hint">Jesteś w pokoju jako <strong>${escapeHtml(state.you?.nickname ?? state.nickname)}</strong>. Host uruchomi mecz.</p>
      <h3 style="margin-top:1.25rem">Gracze (${players.length})</h3>
      ${playerListHtml(players)}
      <div class="actions" style="margin-top:1rem">
        <button type="button" class="secondary" data-action="leave">Opuść pokój</button>
      </div>
    </div>
  </div>`
}

function renderCountdown(snap: RoomSnapshot): string {
  const left = Math.max(1, Math.ceil(((snap.countdownEndsAt ?? Date.now()) - Date.now()) / 1000))
  return `<div class="screen">
    <div class="status-bar">
      <span class="badge">${escapeHtml(roundLabel(snap))}</span>
      ${snap.singleElimStarted ? '<span class="badge out">finał — widzowie</span>' : ''}
    </div>
    <p class="countdown-big" data-countdown>${left}</p>
    <div class="panel">
      <p class="hint" style="margin:0 0 0.75rem">Przygotuj się. Tekst (~${ROUND_SECONDS} s, ok. 20–25 słów):</p>
      <div class="passage"><span class="todo">${escapeHtml(snap.text)}</span></div>
    </div>
  </div>`
}

function renderRace(snap: RoomSnapshot): string {
  const isHost = state.mode === 'host'
  const you = state.you
  const spectating = Boolean(you?.spectating || (you && !you.canType))
  const stats = currentStats()

  const stage = isHost
    ? `<div class="typing-stage host-live">
        <div class="passage-wrap">${hostPassageHtml(snap)}${flagsLayerHtml(snap)}</div>
      </div>`
    : `<div class="typing-stage" data-focus-stage>
        ${
          spectating
            ? `<p class="hint">Oglądasz finał — możesz śledzić postęp na liście graczy.</p>
               <div class="passage-wrap">${hostPassageHtml(snap)}${flagsLayerHtml(snap)}</div>`
            : `<div class="passage-wrap">${passageHtml(snap.text, state.caret, true)}${flagsLayerHtml(snap)}</div>`
        }
      </div>`

  return `<div class="screen">
    <div class="race-header">
      <div>
        <div class="status-bar" style="margin:0">
          <span class="badge">${escapeHtml(roundLabel(snap))}</span>
          ${isHost ? '<span class="badge">PODGLĄD HOSTA</span>' : ''}
          ${spectating ? '<span class="badge">WIDZ</span>' : ''}
        </div>
      </div>
      <div class="stat-pills">
        <div class="stat-pill"><span class="label">Czas</span><span class="value" data-clock>${formatTimeLeft(snap.roundEndsAt)}</span></div>
        ${
          !isHost && !spectating
            ? `<div class="stat-pill"><span class="label">Znaki</span><span class="value" data-chars>${stats.correctChars}</span></div>
               <div class="stat-pill"><span class="label">Punkty</span><span class="value" data-score>${state.you?.roundStats.roundScore ?? 0}</span></div>
               <div class="stat-pill"><span class="label">WPM</span><span class="value" data-wpm>${stats.wpm}</span></div>`
            : ''
        }
      </div>
    </div>
    ${stage}
    <div class="panel">
      <h3>Gracze</h3>
      ${playerListHtml(snap.players, { showStats: true })}
    </div>
  </div>`
}

function renderTrainCountdown(train: TrainState): string {
  const left = Math.max(1, Math.ceil(((train.countdownEndsAt ?? Date.now()) - Date.now()) / 1000))
  return `<div class="screen">
    <div class="status-bar">
      <span class="badge">TRENING</span>
      <span class="badge">${escapeHtml(train.title)}</span>
    </div>
    <p class="countdown-big" data-countdown>${left}</p>
    <div class="panel">
      <p class="hint" style="margin:0 0 0.75rem">${escapeHtml(train.source)} · ~${ROUND_SECONDS} s, ok. 20–25 słów</p>
      <div class="passage"><span class="todo">${escapeHtml(train.text)}</span></div>
    </div>
    <div class="actions" style="margin-top:1rem">
      <button type="button" class="secondary" data-action="home">Anuluj</button>
    </div>
  </div>`
}

function renderTrainRace(train: TrainState): string {
  const stats = currentStats()
  const score = exclusiveScores([state.caret])[0] ?? 0
  return `<div class="screen">
    <div class="race-header">
      <div class="status-bar" style="margin:0">
        <span class="badge">TRENING</span>
        <span class="badge">${escapeHtml(train.title)}</span>
      </div>
      <div class="stat-pills">
        <div class="stat-pill"><span class="label">Czas</span><span class="value" data-clock>${formatTimeLeft(train.roundEndsAt)}</span></div>
        <div class="stat-pill"><span class="label">Znaki</span><span class="value" data-chars>${stats.correctChars}</span></div>
        <div class="stat-pill"><span class="label">Punkty</span><span class="value" data-score>${score}</span></div>
        <div class="stat-pill"><span class="label">WPM</span><span class="value" data-wpm>${stats.wpm}</span></div>
      </div>
    </div>
    <div class="typing-stage" data-focus-stage>
      <div class="passage-wrap">${passageHtml(train.text, state.caret, true)}</div>
    </div>
    <p class="hint">Solo: 100 pkt za znak. Zły klawisz nie przesuwa kursora.</p>
    <div class="actions" style="margin-top:1rem">
      <button type="button" class="secondary" data-action="home">Zakończ trening</button>
    </div>
  </div>`
}

function renderTrainResults(train: TrainState): string {
  const done = train.resultChars >= train.text.length
  return `<div class="screen">
    <div class="status-bar">
      <h2 style="font-family:var(--serif);font-weight:400;margin:0;font-size:2rem">Wynik treningu</h2>
      <span class="badge">${escapeHtml(train.title)}</span>
    </div>
    <div class="stat-pills" style="margin:1rem 0 1.25rem">
      <div class="stat-pill"><span class="label">Punkty</span><span class="value">${train.resultScore}</span></div>
      <div class="stat-pill"><span class="label">Znaki</span><span class="value">${train.resultChars}/${train.text.length}</span></div>
      <div class="stat-pill"><span class="label">WPM</span><span class="value">${train.resultWpm}</span></div>
      <div class="stat-pill"><span class="label">Status</span><span class="value">${done ? 'ukończono' : 'czas'}</span></div>
    </div>
    <div class="panel">
      <p class="hint" style="margin:0 0 0.5rem">${escapeHtml(train.source)}</p>
      <div class="passage"><span class="todo">${escapeHtml(train.text)}</span></div>
    </div>
    <div class="actions" style="margin-top:1.25rem">
      <button type="button" data-action="train-again">Kolejny tekst</button>
      <button type="button" class="secondary" data-action="home">Do menu</button>
    </div>
  </div>`
}

function renderRoundResults(snap: RoomSnapshot): string {
  const rows = rankedForRound(snap)
  const isHost = state.mode === 'host'
  return `<div class="screen">
    <div class="status-bar">
      <h2 style="font-family:var(--serif);font-weight:400;margin:0;font-size:2rem">${escapeHtml(roundLabel(snap))}</h2>
    </div>
    <div class="table-wrap">
      <table class="standings">
        <thead>
          <tr>
            <th>#</th>
            <th>Gracz</th>
            <th>Punkty</th>
            <th>Znaki</th>
            <th>WPM</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((p, i) => {
              let status = 'w grze'
              if (p.eliminated && p.eliminatedRound === snap.roundIndex) status = 'wypada'
              else if (p.eliminated) status = 'out'
              else if (!p.connected) status = 'offline'
              return `<tr>
                <td>${i + 1}</td>
                <td><span class="swatch" style="display:inline-block;margin-right:0.4rem;background:${p.color}"></span>${escapeHtml(p.nickname)}</td>
                <td>${p.roundStats.roundScore}</td>
                <td>${p.roundStats.correctChars}</td>
                <td>${p.roundStats.wpm}</td>
                <td>${status}</td>
              </tr>`
            })
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="actions" style="margin-top:1.25rem">
      ${
        isHost
          ? `<button type="button" data-action="next-round">Następna runda</button>
             <button type="button" class="secondary" data-action="home">Zakończ i wyjdź</button>`
          : `<p class="hint">Czekaj na hosta…</p>`
      }
    </div>
  </div>`
}

function renderFinal(snap: RoomSnapshot): string {
  const rows = finalRows(snap)
  return `<div class="screen">
    <h1 class="brand" style="font-size:2.8rem">Wyniki</h1>
    <p class="tagline">Tabela miejsc i statystyk całego meczu.</p>
    <div class="table-wrap">
      <table class="standings">
        <thead>
          <tr>
            <th>Miejsce</th>
            <th>Gracz</th>
            <th>Punkty</th>
            <th>Ostatnia runda</th>
            <th>Znaki</th>
            <th>Wypadł w rundzie</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((p) => {
              const win = p.id === snap.winnerId ? 'winner' : ''
              return `<tr class="${win}">
                <td>${p.place ?? '—'}</td>
                <td><span class="swatch" style="display:inline-block;margin-right:0.4rem;background:${p.color}"></span>${escapeHtml(p.nickname)}</td>
                <td>${p.totalScore}</td>
                <td>${p.roundStats.roundScore}</td>
                <td>${p.roundStats.correctChars}</td>
                <td>${p.eliminatedRound ?? (p.id === snap.winnerId ? 'zwycięzca' : '—')}</td>
              </tr>`
            })
            .join('')}
        </tbody>
      </table>
    </div>
    <div class="actions" style="margin-top:1.25rem">
      <button type="button" data-action="home">Do menu</button>
    </div>
  </div>`
}

function render(): void {
  const snap = state.snapshot
  let html = ''
  switch (state.screen) {
    case 'home':
      html = renderHome()
      break
    case 'host-lobby':
      html = renderHostLobby(snap)
      break
    case 'join':
      html = renderJoin()
      break
    case 'player-lobby':
      html = renderPlayerLobby(snap)
      break
    case 'countdown':
      html = snap ? renderCountdown(snap) : renderHome()
      break
    case 'race':
      html = snap ? renderRace(snap) : renderHome()
      break
    case 'round-results':
      html = snap ? renderRoundResults(snap) : renderHome()
      break
    case 'final':
      html = snap ? renderFinal(snap) : renderHome()
      break
    case 'train-countdown':
      html = state.train ? renderTrainCountdown(state.train) : renderHome()
      break
    case 'train-race':
      html = state.train ? renderTrainRace(state.train) : renderHome()
      break
    case 'train-results':
      html = state.train ? renderTrainResults(state.train) : renderHome()
      break
    default:
      html = renderHome()
  }
  app.innerHTML = html
  bindDom()
}

function updateClockDom(): void {
  const clock = app.querySelector('[data-clock]')
  if (clock) {
    if (state.mode === 'train' && state.train) {
      clock.textContent = formatTimeLeft(state.train.roundEndsAt)
    } else if (state.snapshot) {
      clock.textContent = formatTimeLeft(state.snapshot.roundEndsAt)
    }
  }
  const cd = app.querySelector('[data-countdown]')
  if (cd) {
    const endsAt =
      state.mode === 'train'
        ? state.train?.countdownEndsAt
        : state.snapshot?.countdownEndsAt
    if (endsAt) {
      const left = Math.max(1, Math.ceil((endsAt - Date.now()) / 1000))
      cd.textContent = String(left)
    }
  }
}

function updateLocalStatsDom(): void {
  const stats = currentStats()
  const wpm = app.querySelector('[data-wpm]')
  const chars = app.querySelector('[data-chars]')
  const score = app.querySelector('[data-score]')
  if (wpm) wpm.textContent = String(stats.wpm)
  if (chars) chars.textContent = String(stats.correctChars)
  const scoreVal =
    state.mode === 'train'
      ? (exclusiveScores([state.caret])[0] ?? 0)
      : (state.you?.roundStats.roundScore ?? 0)
  if (score) score.textContent = String(scoreVal)
}

function updateRaceLiveDom(snap: RoomSnapshot): void {
  const isHost = state.mode === 'host'
  const wrap = app.querySelector('.passage-wrap')
  if (wrap && isHost) {
    wrap.innerHTML = `${hostPassageHtml(snap)}${flagsLayerHtml(snap)}`
  } else if (wrap && state.mode === 'player') {
    if (state.you?.spectating || !state.you?.canType) {
      wrap.innerHTML = `${hostPassageHtml(snap)}${flagsLayerHtml(snap)}`
    } else {
      const layer = wrap.querySelector('.flags-layer')
      if (layer) layer.outerHTML = flagsLayerHtml(snap)
      else wrap.insertAdjacentHTML('beforeend', flagsLayerHtml(snap))
    }
  }

  const listPanel = app.querySelector('.panel')
  if (listPanel) {
    listPanel.innerHTML = `<h3>Gracze</h3>${playerListHtml(snap.players, { showStats: true })}`
  }
  updateClockDom()
  if (state.mode === 'player') updateLocalStatsDom()
}

function renderPassageOnly(): void {
  const wrap = app.querySelector('.passage-wrap')
  if (!wrap) return
  if (state.mode === 'train' && state.train) {
    wrap.innerHTML = passageHtml(state.train.text, state.caret, true)
    return
  }
  if (!state.snapshot || state.mode !== 'player') return
  if (state.you?.spectating || !state.you?.canType) return
  wrap.innerHTML = `${passageHtml(state.snapshot.text, state.caret, true)}${flagsLayerHtml(state.snapshot)}`
}

function bindDom(): void {
  app.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', () => {
      const action = (el as HTMLElement).dataset.action
      void handleAction(action ?? '')
    })
  })

  app.querySelectorAll('[data-field]').forEach((el) => {
    el.addEventListener('input', () => {
      const field = (el as HTMLInputElement).dataset.field
      const value = (el as HTMLInputElement).value
      if (field === 'joinCode') state.joinCode = value.toUpperCase()
      if (field === 'nickname') state.nickname = value
    })
  })

  app.querySelectorAll('[data-th]').forEach((el) => {
    el.addEventListener('change', () => {
      const key = (el as HTMLInputElement).dataset.th as keyof EliminationThresholds
      const value = Math.max(1, Number((el as HTMLInputElement).value) || 1)
      state.thresholds = { ...state.thresholds, [key]: value }
      state.host?.updateThresholds(state.thresholds)
    })
  })
}

async function handleAction(action: string): Promise<void> {
  switch (action) {
    case 'goto-train':
      startTrainRound(false)
      break
    case 'train-again':
      startTrainRound(true)
      break
    case 'goto-host':
      state.thresholds = { ...DEFAULT_THRESHOLDS }
      await startHost()
      break
    case 'goto-join':
      clearSessions()
      state.error = null
      state.screen = 'join'
      state.nickname = getCachedNickname()
      render()
      break
    case 'join':
      await joinRoom(false)
      break
    case 'reconnect':
      await joinRoom(true)
      break
    case 'start-match':
      state.host?.startMatch()
      break
    case 'next-round':
      state.host?.nextRound()
      break
    case 'leave':
      state.client?.leave()
      clearSessions()
      state.screen = 'home'
      render()
      break
    case 'home':
      clearSessions()
      state.error = null
      state.screen = 'home'
      render()
      break
  }
}

render()
