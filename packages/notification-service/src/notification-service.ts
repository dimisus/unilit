import { WalletApiService } from '@unisat/wallet-api'
import { Logger, StoredNotification } from '@unisat/wallet-shared'
import { ProxyStorageAdapter } from '@unisat/wallet-storage'
import { NotificationStore } from './types'

const MAX_NOTIFICATIONS = 20
// Read notifications are deleted after 7 days
const READ_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// Default no-op logger
const defaultLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

export interface NotificationServiceConfig {
  storage?: ProxyStorageAdapter
  logger?: Logger
  api?: WalletApiService
}

export class NotificationService {
  private storage: ProxyStorageAdapter = undefined as any
  private logger: Logger = defaultLogger
  private storageKey: string = 'notifications'
  private store: NotificationStore = {}

  constructor() {}

  async init(config: NotificationServiceConfig): Promise<void> {
    if (config.storage) {
      this.storage = config.storage
    }
    if (config.logger) {
      this.logger = config.logger
    }

    this.logger.debug('Initializing notification service...')

    try {
      const storedData = await this.storage.get(this.storageKey)
      this.store = storedData || {}
      this.logger.debug('Notification service initialization completed')
    } catch (error) {
      this.logger.error('Notification service initialization failed:', error)
      throw error
    }
  }

  resetAllData = () => {
    this.storage.set(this.storageKey, {})
    this.store = {}
  }

  // Local store only. This wallet does not talk to the notification server.
  getNotifications = async (): Promise<StoredNotification[]> => {
    const now = Date.now()
    let changed = false
    for (const id of Object.keys(this.store)) {
      const entry = this.store[id]
      if (entry.readAt !== undefined && now - entry.readAt > READ_EXPIRY_MS) {
        delete this.store[id]
        changed = true
      }
    }

    const entries = Object.values(this.store)
    if (entries.length > MAX_NOTIFICATIONS) {
      entries.sort((a, b) => b.priority - a.priority || b.publishTime - a.publishTime)
      const keep = entries.slice(0, MAX_NOTIFICATIONS)
      const keepIds = new Set(keep.map(e => e.id))
      for (const id of Object.keys(this.store)) {
        if (!keepIds.has(id)) {
          delete this.store[id]
          changed = true
        }
      }
    }

    if (changed) {
      await this.storage.set(this.storageKey, this.store)
    }

    return Object.values(this.store).sort(
      (a, b) => b.priority - a.priority || b.publishTime - a.publishTime
    )
  }

  markAsRead = async (id: string): Promise<void> => {
    if (!this.store[id]) return

    this.store[id] = { ...this.store[id], readAt: Date.now() }
    await this.storage.set(this.storageKey, this.store)
  }

  readAll = async (): Promise<void> => {
    const unreadIds = Object.values(this.store)
      .filter(n => n.readAt === undefined)
      .map(n => n.id)

    if (unreadIds.length === 0) return

    const now = Date.now()
    for (const id of unreadIds) {
      this.store[id] = { ...this.store[id], readAt: now }
    }
    await this.storage.set(this.storageKey, this.store)
  }

  deleteNotification = async (id: string): Promise<void> => {
    if (!this.store[id]) return

    delete this.store[id]
    await this.storage.set(this.storageKey, this.store)
  }

  getUnreadCount = (): number => {
    return Object.values(this.store).filter(n => n.readAt === undefined).length
  }
}
