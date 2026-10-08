import { AnnouncementLinkType, StoredNotification } from '@unisat/wallet-shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationService } from '../src/notification-service'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeItem(overrides?: Partial<StoredNotification>): StoredNotification {
  return {
    id: 'n1',
    title: 'Test',
    content: 'Content',
    type: 'info',
    linkType: AnnouncementLinkType.NONE,
    priority: 1,
    publishTime: 1000,
    ...overrides,
  }
}

function makeStorage(initial: Record<string, any> = {}) {
  const db: Record<string, any> = { ...initial }
  return {
    get: vi.fn(async (key: string) => db[key]),
    set: vi.fn(async (key: string, value: any) => {
      db[key] = value
    }),
    _db: db,
  }
}

function makeApi(list: StoredNotification[] = []) {
  return {
    notification: {
      getList: vi.fn().mockResolvedValue({ list, total: list.length }),
      read: vi.fn().mockResolvedValue({ success: true }),
      readAll: vi.fn().mockResolvedValue({ success: true }),
    },
  }
}

async function initService(
  service: NotificationService,
  opts: { stored?: Record<string, StoredNotification>; list?: StoredNotification[] } = {}
) {
  const storage = makeStorage(opts.stored ? { notifications: opts.stored } : {})
  const api = makeApi(opts.list ?? [])
  await service.init({ storage: storage as any, api: api as any })
  return { storage, api }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('NotificationService', () => {
  let service: NotificationService

  beforeEach(() => {
    service = new NotificationService()
  })

  // ── init ──────────────────────────────────────────────────────────────────

  describe('init', () => {
    it('loads existing data from storage', async () => {
      const stored = { n1: makeItem() }
      const { api } = await initService(service, { stored, list: [makeItem()] })
      const results = await service.getNotifications()
      expect(results[0].id).toBe('n1')
    })

    it('starts with empty store when storage has no data', async () => {
      const storage = makeStorage()
      const api = makeApi()
      await service.init({ storage: storage as any, api: api as any })
      const results = await service.getNotifications()
      expect(results).toHaveLength(0)
    })

    it('throws when storage fails', async () => {
      const storage = { get: vi.fn().mockRejectedValue(new Error('storage error')), set: vi.fn() }
      await expect(service.init({ storage: storage as any })).rejects.toThrow('storage error')
    })
  })

  // ── getNotifications ──────────────────────────────────────────────────────

  describe('getNotifications', () => {
    it('returns locally stored items and does not call the server', async () => {
      const { api } = await initService(service, {
        stored: {
          n1: makeItem({ id: 'n1' }),
          n2: makeItem({ id: 'n2' }),
        },
        list: [makeItem({ id: 'from-server' })],
      })
      const results = await service.getNotifications()
      expect(results.map(r => r.id).sort()).toEqual(['n1', 'n2'])
      expect(api.notification.getList).not.toHaveBeenCalled()
    })

    it('preserves local readAt when server returns same item', async () => {
      const readAt = Date.now() - 1000
      const stored = { n1: makeItem({ readAt }) }
      await initService(service, { stored, list: [makeItem({ id: 'n1' })] })
      const results = await service.getNotifications()
      expect(results[0].readAt).toBe(readAt)
    })

    it('sorts by priority desc then publishTime desc', async () => {
      const stored = {
        a: makeItem({ id: 'a', priority: 1, publishTime: 100 }),
        b: makeItem({ id: 'b', priority: 3, publishTime: 50 }),
        c: makeItem({ id: 'c', priority: 2, publishTime: 200 }),
      }
      await initService(service, { stored })
      const results = await service.getNotifications()
      expect(results.map(r => r.id)).toEqual(['b', 'c', 'a'])
    })

    it('caps store at 20 items, keeping highest priority', async () => {
      const stored = Object.fromEntries(
        Array.from({ length: 25 }, (_, i) => [`n${i}`, makeItem({ id: `n${i}`, priority: i, publishTime: i })])
      )
      await initService(service, { stored })
      const results = await service.getNotifications()
      expect(results).toHaveLength(20)
      // highest priority items should be kept
      expect(results[0].id).toBe('n24')
    })

    it('purges read entries older than 7 days', async () => {
      const sevenDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
      const stored = {
        old: makeItem({ id: 'old', readAt: sevenDaysAgo }),
        fresh: makeItem({ id: 'fresh' }),
      }
      await initService(service, { stored, list: [] })
      const results = await service.getNotifications()
      expect(results.find(r => r.id === 'old')).toBeUndefined()
      expect(results.find(r => r.id === 'fresh')).toBeDefined()
    })

    it('does not call the notification API', async () => {
      const stored = { n1: makeItem() }
      const { api } = await initService(service, { stored })
      const results = await service.getNotifications()
      expect(results[0].id).toBe('n1')
      expect(api.notification.getList).not.toHaveBeenCalled()
    })
  })

  // ── markAsRead ────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('sets readAt locally and does not call the server', async () => {
      const { api, storage } = await initService(service, {
        stored: { n1: makeItem() },
        list: [],
      })
      await service.markAsRead('n1')
      expect(api.notification.read).not.toHaveBeenCalled()
      const saved = storage._db['notifications']['n1']
      expect(saved.readAt).toBeTypeOf('number')
    })

    it('does nothing when id does not exist', async () => {
      const { api } = await initService(service, { list: [] })
      await service.markAsRead('unknown')
      expect(api.notification.read).not.toHaveBeenCalled()
    })
  })

  // ── deleteNotification ────────────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('deletes an unread notification without calling the server', async () => {
      const { api } = await initService(service, {
        stored: { n1: makeItem() },
        list: [],
      })
      await service.deleteNotification('n1')
      expect(api.notification.read).not.toHaveBeenCalled()
    })

    it('skips server read call if already read', async () => {
      const { api } = await initService(service, {
        stored: { n1: makeItem({ readAt: Date.now() }) },
        list: [],
      })
      await service.deleteNotification('n1')
      expect(api.notification.read).not.toHaveBeenCalled()
    })

    it('removes the notification from store', async () => {
      const { storage } = await initService(service, {
        stored: { n1: makeItem() },
        list: [],
      })
      await service.deleteNotification('n1')
      expect(storage._db['notifications']['n1']).toBeUndefined()
    })

    it('does nothing when id does not exist', async () => {
      const { api } = await initService(service, { list: [] })
      await service.deleteNotification('unknown')
      expect(api.notification.read).not.toHaveBeenCalled()
    })

    it('deletes locally without a server round trip', async () => {
      const storage = makeStorage({ notifications: { n1: makeItem() } })
      const api = {
        notification: {
          getList: vi.fn(),
          read: vi.fn(),
        },
      }
      await service.init({ storage: storage as any, api: api as any })
      await service.deleteNotification('n1')
      expect(storage._db['notifications']['n1']).toBeUndefined()
      expect(api.notification.read).not.toHaveBeenCalled()
    })
  })

  // ── getUnreadCount ────────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      const stored = {
        n1: makeItem({ id: 'n1' }),
        n2: makeItem({ id: 'n2', readAt: Date.now() }),
        n3: makeItem({ id: 'n3' }),
      }
      await initService(service, { stored, list: [] })
      expect(service.getUnreadCount()).toBe(2)
    })

    it('returns 0 when all are read', async () => {
      const stored = { n1: makeItem({ readAt: Date.now() }) }
      await initService(service, { stored, list: [] })
      expect(service.getUnreadCount()).toBe(0)
    })

    it('returns 0 when store is empty', async () => {
      await initService(service)
      expect(service.getUnreadCount()).toBe(0)
    })
  })

  // ── readAll ───────────────────────────────────────────────────────────────

  describe('readAll', () => {
    it('marks unread items locally and does not call the server', async () => {
      const stored = {
        n1: makeItem({ id: 'n1' }),
        n2: makeItem({ id: 'n2' }),
        n3: makeItem({ id: 'n3', readAt: Date.now() }),
      }
      const { api } = await initService(service, { stored, list: [] })
      await service.readAll()
      expect(api.notification.readAll).not.toHaveBeenCalled()
    })

    it('sets readAt on all previously unread notifications', async () => {
      const before = Date.now()
      const stored = {
        n1: makeItem({ id: 'n1' }),
        n2: makeItem({ id: 'n2' }),
      }
      const { storage } = await initService(service, { stored, list: [] })
      await service.readAll()
      const saved = storage._db['notifications']
      expect(saved['n1'].readAt).toBeGreaterThanOrEqual(before)
      expect(saved['n2'].readAt).toBeGreaterThanOrEqual(before)
    })

    it('does not overwrite readAt of already-read notifications', async () => {
      const originalReadAt = Date.now() - 5000
      const stored = {
        n1: makeItem({ id: 'n1' }),
        n2: makeItem({ id: 'n2', readAt: originalReadAt }),
      }
      const { storage } = await initService(service, { stored, list: [] })
      await service.readAll()
      expect(storage._db['notifications']['n2'].readAt).toBe(originalReadAt)
    })

    it('persists updated store to storage', async () => {
      const stored = { n1: makeItem({ id: 'n1' }) }
      const { storage } = await initService(service, { stored, list: [] })
      await service.readAll()
      expect(storage.set).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          n1: expect.objectContaining({ readAt: expect.any(Number) }),
        })
      )
    })

    it('does nothing when there are no unread notifications', async () => {
      const stored = { n1: makeItem({ id: 'n1', readAt: Date.now() }) }
      const { api, storage } = await initService(service, { stored, list: [] })
      storage.set.mockClear()
      await service.readAll()
      expect(api.notification.readAll).not.toHaveBeenCalled()
      expect(storage.set).not.toHaveBeenCalled()
    })

    it('getUnreadCount returns 0 after readAll', async () => {
      const stored = {
        n1: makeItem({ id: 'n1' }),
        n2: makeItem({ id: 'n2' }),
      }
      await initService(service, { stored, list: [] })
      await service.readAll()
      expect(service.getUnreadCount()).toBe(0)
    })
  })

  // ── resetAllData ──────────────────────────────────────────────────────────

  describe('resetAllData', () => {
    it('clears all notifications from store and storage', async () => {
      const { storage } = await initService(service, {
        stored: { n1: makeItem() },
        list: [],
      })
      service.resetAllData()
      expect(service.getUnreadCount()).toBe(0)
      expect(storage.set).toHaveBeenCalledWith('notifications', {})
    })
  })
})
