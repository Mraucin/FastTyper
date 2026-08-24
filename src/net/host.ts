import { Peer, type DataConnection } from 'peerjs'
import { pickPassage } from '../data/texts'
import {
  applyExclusiveScores,
  eliminationCount,
  isSingleEliminationPhase,
  rankPlayers,
} from '../game/logic'
import type {
  EliminationThresholds,
  GameSettings,
  PlayerPublic,
  PlayerStats,
  RoundCheckpoint,
  RoomSnapshot,
} from '../types'
import { COUNTDOWN_SECONDS, MAX_PLAYERS } from '../types'
import {
  type ClientToHost,
  type HostToClient,
  PLAYER_COLORS,
  createRoomCode,
  defaultSettings,
  emptyStats,
  peerIdForCode,
} from './protocol'

interface HostPlayer {
  public: PlayerPublic
  conn: DataConnection | null
  checkpoint: RoundCheckpoint
}

type Listener = (snapshot: RoomSnapshot) => void

export class HostSession {
  readonly code: string
  private peer: Peer | null = null
  private players = new Map<string, HostPlayer>()
  private settings: GameSettings
  private phase: RoomSnapshot['phase'] = 'lobby'
  private roundIndex = 0
  private isPractice = true
  private singleElimStarted = false
  private text = ''
  private textId = ''
  private usedTextIds: string[] = []
  private roundEndsAt: number | null = null
  private countdownEndsAt: number | null = null
  private winnerId: string | null = null
  private timers: number[] = []
  private listeners = new Set<Listener>()
  private destroyed = false
  private lastBroadcastAt = 0
  private pendingBroadcast: number | null = null

  constructor(thresholds?: Partial<EliminationThresholds>) {
    this.code = createRoomCode()
    this.settings = defaultSettings(thresholds)
  }

  onSnapshot(fn: Listener): () => void {
    this.listeners.add(fn)
    fn(this.snapshot())
    return () => this.listeners.delete(fn)
  }

  async start(): Promise<void> {
    const id = peerIdForCode(this.code)
    this.peer = new Peer(id, { debug: 1 })

    await new Promise<void>((resolve, reject) => {
      const peer = this.peer!
      const onOpen = () => {
        cleanup()
        resolve()
      }
      const onError = (err: Error) => {
        cleanup()
        reject(err)
      }
      const cleanup = () => {
        peer.off('open', onOpen)
        peer.off('error', onError)
      }
      peer.on('open', onOpen)
      peer.on('error', onError)
    })

    this.peer.on('connection', (conn) => this.handleConnection(conn))
    this.peer.on('disconnected', () => {
      if (!this.destroyed) this.peer?.reconnect()
    })
  }

  updateThresholds(thresholds: EliminationThresholds): void {
    if (this.phase !== 'lobby') return
    this.settings = { ...this.settings, thresholds }
    this.broadcast()
  }

  startMatch(): void {
    if (this.phase !== 'lobby') return
    const connected = [...this.players.values()].filter((p) => p.public.connected)
    if (connected.length < 2) return
    this.roundIndex = 0
    this.isPractice = true
    this.singleElimStarted = false
    this.winnerId = null
    for (const p of this.players.values()) {
      p.public.eliminated = false
      p.public.eliminatedRound = null
      p.public.canType = true
      p.public.spectating = false
      p.public.totalScore = 0
      p.public.place = null
      p.public.roundStats = emptyStats()
      this.saveCheckpoint(p)
    }
    this.beginCountdown()
  }

  nextRound(): void {
    if (this.phase !== 'round-results') return
    const active = this.activePlayers()
    if (active.length <= 1) {
      this.finishMatch()
      return
    }
    this.beginCountdown()
  }

  destroy(): void {
    this.destroyed = true
    for (const t of this.timers) window.clearTimeout(t)
    this.timers = []
    if (this.pendingBroadcast != null) window.clearTimeout(this.pendingBroadcast)
    this.pendingBroadcast = null
    for (const p of this.players.values()) {
      p.conn?.close()
    }
    this.peer?.destroy()
    this.peer = null
  }

  snapshot(): RoomSnapshot {
    return {
      code: this.code,
      phase: this.phase,
      roundIndex: this.roundIndex,
      isPractice: this.isPractice,
      singleElimStarted: this.singleElimStarted,
      text: this.text,
      textId: this.textId,
      roundEndsAt: this.roundEndsAt,
      countdownEndsAt: this.countdownEndsAt,
      players: [...this.players.values()].map((p) => ({ ...p.public, roundStats: { ...p.public.roundStats } })),
      settings: {
        ...this.settings,
        thresholds: { ...this.settings.thresholds },
      },
      winnerId: this.winnerId,
    }
  }

  private activePlayers(): HostPlayer[] {
    return [...this.players.values()].filter((p) => !p.public.eliminated)
  }

  private emit(): void {
    const snap = this.snapshot()
    for (const fn of this.listeners) fn(snap)
  }

  private broadcast(force = false): void {
    if (this.phase === 'racing' && !force) {
      const now = Date.now()
      if (now - this.lastBroadcastAt < 250) {
        if (this.pendingBroadcast == null) {
          this.pendingBroadcast = window.setTimeout(() => {
            this.pendingBroadcast = null
            this.broadcast(true)
          }, 250)
        }
        return
      }
    }
    if (this.pendingBroadcast != null) {
      window.clearTimeout(this.pendingBroadcast)
      this.pendingBroadcast = null
    }
    this.lastBroadcastAt = Date.now()
    this.emit()
    const msg: HostToClient = { type: 'snapshot', snapshot: this.snapshot() }
    for (const p of this.players.values()) {
      if (p.conn?.open) p.conn.send(msg)
    }
  }

  private send(conn: DataConnection, msg: HostToClient): void {
    if (conn.open) conn.send(msg)
  }

  private handleConnection(conn: DataConnection): void {
    conn.on('open', () => {
      // wait for join message
    })
    conn.on('data', (raw) => {
      const msg = raw as ClientToHost
      this.onClientMessage(conn, msg)
    })
    conn.on('close', () => this.onConnClose(conn))
  }

  private findByConn(conn: DataConnection): HostPlayer | undefined {
    return [...this.players.values()].find((p) => p.conn === conn)
  }

  private onConnClose(conn: DataConnection): void {
    const player = this.findByConn(conn)
    if (!player) return
    player.conn = null
    player.public.connected = false

    if (this.phase === 'lobby') {
      this.players.delete(player.public.id)
    }
    // mid-match: keep stats
    this.broadcast()
  }

  private onClientMessage(conn: DataConnection, msg: ClientToHost): void {
    switch (msg.type) {
      case 'join':
        this.handleJoin(conn, msg.playerId, msg.nickname, Boolean(msg.reconnect))
        break
      case 'leave':
        this.handleLeave(msg.playerId)
        break
      case 'progress':
        this.handleProgress(msg.playerId, msg.stats)
        break
      case 'ping':
        break
    }
  }

  private handleJoin(
    conn: DataConnection,
    playerId: string,
    nickname: string,
    reconnect: boolean,
  ): void {
    const nick = nickname.trim().slice(0, 20)
    if (!nick) {
      this.send(conn, { type: 'error', message: 'Podaj nickname.' })
      conn.close()
      return
    }

    const existing = this.players.get(playerId)

    if (existing) {
      // Reconnect mid-match
      if (this.phase === 'lobby') {
        existing.conn?.close()
        existing.conn = conn
        existing.public.connected = true
        existing.public.nickname = nick
        this.send(conn, { type: 'welcome', you: existing.public, snapshot: this.snapshot() })
        this.broadcast()
        return
      }

      // Restore checkpoint from before current round
      this.restoreCheckpoint(existing)
      existing.conn?.close()
      existing.conn = conn
      existing.public.connected = true
      existing.public.nickname = nick
      existing.public.roundStats = emptyStats()
      this.send(conn, { type: 'welcome', you: existing.public, snapshot: this.snapshot() })
      this.broadcast()
      return
    }

    if (this.phase !== 'lobby') {
      this.send(conn, {
        type: 'error',
        message: 'Mecz już trwa. Możesz dołączyć ponownie tylko tym samym ID gracza.',
      })
      conn.close()
      return
    }

    if (this.players.size >= MAX_PLAYERS) {
      this.send(conn, { type: 'error', message: `Pokój pełny (max ${MAX_PLAYERS}).` })
      conn.close()
      return
    }

    const color = PLAYER_COLORS[this.players.size % PLAYER_COLORS.length]!
    const pub: PlayerPublic = {
      id: playerId,
      nickname: nick,
      color,
      connected: true,
      eliminated: false,
      eliminatedRound: null,
      canType: true,
      spectating: false,
      totalScore: 0,
      roundStats: emptyStats(),
      place: null,
    }
    const hp: HostPlayer = {
      public: pub,
      conn,
      checkpoint: {
        totalScore: 0,
        eliminated: false,
        eliminatedRound: null,
        canType: true,
        spectating: false,
      },
    }
    this.players.set(playerId, hp)
    this.send(conn, { type: 'welcome', you: pub, snapshot: this.snapshot() })
    this.broadcast()

    // silence unused
    void reconnect
  }

  private handleLeave(playerId: string): void {
    const p = this.players.get(playerId)
    if (!p) return
    if (this.phase === 'lobby') {
      p.conn?.close()
      this.players.delete(playerId)
    } else {
      p.public.connected = false
      p.conn?.close()
      p.conn = null
    }
    this.broadcast()
  }

  private handleProgress(playerId: string, stats: PlayerStats): void {
    if (this.phase !== 'racing') return
    const p = this.players.get(playerId)
    if (!p || !p.public.canType || p.public.spectating) return
    p.public.roundStats = { ...stats }
    this.recomputeRoundScores()
    this.broadcast()
  }

  private recomputeRoundScores(): void {
    applyExclusiveScores([...this.players.values()].map((p) => p.public))
  }

  private saveCheckpoint(p: HostPlayer): void {
    p.checkpoint = {
      totalScore: p.public.totalScore,
      eliminated: p.public.eliminated,
      eliminatedRound: p.public.eliminatedRound,
      canType: p.public.canType,
      spectating: p.public.spectating,
    }
  }

  private restoreCheckpoint(p: HostPlayer): void {
    const c = p.checkpoint
    p.public.totalScore = c.totalScore
    p.public.eliminated = c.eliminated
    p.public.eliminatedRound = c.eliminatedRound
    p.public.canType = c.canType
    p.public.spectating = c.spectating
  }

  private endRace(): void {
    this.phase = 'round-results'
    this.roundEndsAt = null

    this.recomputeRoundScores()

    const wasPractice = this.isPractice
    for (const p of this.players.values()) {
      if (!wasPractice) {
        p.public.totalScore += p.public.roundStats.roundScore
      }
    }

    if (!wasPractice) {
      this.applyEliminations()
    }

    const active = this.activePlayers()
    if (active.length <= 1) {
      this.isPractice = false
      this.finishMatch()
      return
    }

    const activeCount = active.length
    if (!this.singleElimStarted && isSingleEliminationPhase(activeCount)) {
      this.singleElimStarted = true
      for (const p of this.players.values()) {
        if (p.public.eliminated) {
          p.public.canType = false
          p.public.spectating = true
        }
      }
    }

    // Results for practice still labelled as practice
    this.broadcast()
    if (wasPractice) this.isPractice = false
  }

  private beginCountdown(): void {
    for (const t of this.timers) window.clearTimeout(t)
    this.timers = []

    // Advance round index when starting a non-practice round after the first
    if (!this.isPractice) {
      if (this.roundIndex === 0 && this.phase !== 'lobby') {
        this.roundIndex = 1
      } else if (this.phase === 'round-results') {
        this.roundIndex += 1
      }
    }

    const passage = pickPassage(this.usedTextIds)
    this.usedTextIds.push(passage.id)
    this.text = passage.text
    this.textId = passage.id
    this.roundEndsAt = null
    this.countdownEndsAt = Date.now() + COUNTDOWN_SECONDS * 1000
    this.phase = 'countdown'

    for (const p of this.players.values()) {
      this.saveCheckpoint(p)
      p.public.roundStats = emptyStats()
    }

    this.broadcast()

    const t = window.setTimeout(() => this.beginRace(), COUNTDOWN_SECONDS * 1000)
    this.timers.push(t)
  }

  private beginRace(): void {
    this.phase = 'racing'
    this.countdownEndsAt = null
    this.roundEndsAt = Date.now() + this.settings.roundSeconds * 1000
    this.broadcast()

    const t = window.setTimeout(() => this.endRace(), this.settings.roundSeconds * 1000)
    this.timers.push(t)
  }

  private applyEliminations(): void {
    const active = this.activePlayers()
    const n = eliminationCount(active.length, this.settings.thresholds)
    if (n <= 0) return

    const ranked = rankPlayers(active.map((p) => p.public))
    const toEliminate = ranked.slice(-n)

    for (const pub of toEliminate) {
      const hp = this.players.get(pub.id)
      if (!hp) continue
      hp.public.eliminated = true
      hp.public.eliminatedRound = this.roundIndex
      // Can still type until single-elim phase
      const remaining = active.length - toEliminate.length
      if (remaining <= 4) {
        hp.public.canType = false
        hp.public.spectating = true
        this.singleElimStarted = true
      } else {
        hp.public.canType = true
        hp.public.spectating = false
      }
    }
  }

  private finishMatch(): void {
    this.phase = 'final'

    const sorted = [...this.players.values()]
      .map((p) => p.public)
      .sort((a, b) => {
        if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1
        if (a.eliminated && b.eliminated) {
          const ra = a.eliminatedRound ?? 0
          const rb = b.eliminatedRound ?? 0
          if (rb !== ra) return rb - ra
        }
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return b.roundStats.roundScore - a.roundStats.roundScore
      })

    sorted.forEach((p, i) => {
      p.place = i + 1
    })

    this.winnerId = sorted[0]?.id ?? null
    this.broadcast()
  }
}

export function createHost(
  thresholds?: Partial<EliminationThresholds>,
): HostSession {
  return new HostSession(thresholds)
}
