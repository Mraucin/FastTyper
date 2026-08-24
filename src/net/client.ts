import { Peer, type DataConnection } from 'peerjs'
import type { PlayerPublic, PlayerStats, RoomSnapshot } from '../types'
import type { ClientToHost, HostToClient } from './protocol'
import { peerIdForCode } from './protocol'

type SnapshotListener = (snapshot: RoomSnapshot, you: PlayerPublic | null) => void
type ErrorListener = (message: string) => void

export class ClientSession {
  private peer: Peer | null = null
  private conn: DataConnection | null = null
  private you: PlayerPublic | null = null
  private snapshot: RoomSnapshot | null = null
  private snapshotListeners = new Set<SnapshotListener>()
  private errorListeners = new Set<ErrorListener>()
  private playerId: string
  private nickname: string
  private destroyed = false
  private progressTimer: number | null = null

  constructor(playerId: string, nickname: string) {
    this.playerId = playerId
    this.nickname = nickname
  }

  onSnapshot(fn: SnapshotListener): () => void {
    this.snapshotListeners.add(fn)
    if (this.snapshot) fn(this.snapshot, this.you)
    return () => this.snapshotListeners.delete(fn)
  }

  onError(fn: ErrorListener): () => void {
    this.errorListeners.add(fn)
    return () => this.errorListeners.delete(fn)
  }

  getYou(): PlayerPublic | null {
    return this.you
  }

  getSnapshot(): RoomSnapshot | null {
    return this.snapshot
  }

  async connect(code: string, reconnect = false): Promise<void> {
    const hostId = peerIdForCode(code.trim().toUpperCase())
    this.peer = new Peer({ debug: 1 })

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

    this.conn = this.peer.connect(hostId, { reliable: true })

    await new Promise<void>((resolve, reject) => {
      const conn = this.conn!
      const timeout = window.setTimeout(() => {
        cleanup()
        reject(new Error('Nie znaleziono pokoju. Sprawdź kod.'))
      }, 12000)

      const onOpen = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('Nie udało się połączyć z hostem.'))
      }
      const cleanup = () => {
        window.clearTimeout(timeout)
        conn.off('open', onOpen)
        conn.off('error', onError)
      }
      conn.on('open', onOpen)
      conn.on('error', onError)
    })

    this.conn.on('data', (raw) => this.onHostMessage(raw as HostToClient))
    this.conn.on('close', () => {
      if (!this.destroyed) {
        this.emitError('Utracono połączenie z hostem.')
      }
    })

    this.send({
      type: 'join',
      playerId: this.playerId,
      nickname: this.nickname,
      reconnect,
    })
  }

  sendProgress(stats: PlayerStats): void {
    this.send({ type: 'progress', playerId: this.playerId, stats })
  }

  leave(): void {
    this.send({ type: 'leave', playerId: this.playerId })
    this.destroy()
  }

  destroy(): void {
    this.destroyed = true
    if (this.progressTimer != null) window.clearInterval(this.progressTimer)
    this.conn?.close()
    this.peer?.destroy()
    this.conn = null
    this.peer = null
  }

  private send(msg: ClientToHost): void {
    if (this.conn?.open) this.conn.send(msg)
  }

  private onHostMessage(msg: HostToClient): void {
    switch (msg.type) {
      case 'welcome':
        this.you = msg.you
        this.snapshot = msg.snapshot
        this.emitSnapshot()
        break
      case 'snapshot':
        this.snapshot = msg.snapshot
        if (this.you) {
          const updated = msg.snapshot.players.find((p: PlayerPublic) => p.id === this.you!.id)
          if (updated) this.you = updated
        }
        this.emitSnapshot()
        break
      case 'error':
        this.emitError(msg.message)
        break
      case 'kicked':
        this.emitError(msg.reason)
        this.destroy()
        break
    }
  }

  private emitSnapshot(): void {
    if (!this.snapshot) return
    for (const fn of this.snapshotListeners) fn(this.snapshot, this.you)
  }

  private emitError(message: string): void {
    for (const fn of this.errorListeners) fn(message)
  }
}
