import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlatformEnv } from '@unisat/wallet-shared'
import { WalletApiService } from '../src/walletapi-service'

vi.mock('randomstring', () => ({
  default: {
    generate: vi.fn().mockReturnValue('device123456'),
  },
}))

describe('WalletApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    PlatformEnv.VERSION = '1.0.0'
    PlatformEnv.CHANNEL = 'stable'
    PlatformEnv.UDID = ''
    PlatformEnv.UDID2 = 'udid2'
  })

  it('init sets client base url and headers, and writes PlatformEnv.UDID', async () => {
    const storage = {
      createPersistentProxy: vi.fn().mockResolvedValue({ deviceId: 'persisted-udid' }),
      set: vi.fn(),
    }

    const httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      setBaseURL: vi.fn(),
      setHeaders: vi.fn(),
    }

    const service = new WalletApiService()
    await service.init({ storage: storage as any, httpClient: httpClient as any, endpoint: 'https://e.test' })

    expect(storage.createPersistentProxy).toHaveBeenCalledWith('openapi', { deviceId: 'device123456' })
    expect(httpClient.setBaseURL).toHaveBeenCalledWith('https://e.test')
    expect(httpClient.setHeaders).toHaveBeenCalledWith(
      expect.objectContaining({
        'x-client': 'UniLit Wallet',
        'x-version': '1.0.0',
        'x-channel': 'stable',
        'x-udid': '',
        'x-udid2': 'udid2',
      })
    )
    expect(PlatformEnv.UDID).toBe('persisted-udid')
  })

  it('setClientAddress and setEndpoint update headers/baseURL', async () => {
    const storage = {
      createPersistentProxy: vi.fn().mockResolvedValue({ deviceId: 'd1' }),
      set: vi.fn(),
    }

    const httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      setBaseURL: vi.fn(),
      setHeaders: vi.fn(),
    }

    const service = new WalletApiService()
    await service.init({ storage: storage as any, httpClient: httpClient as any })

    await service.setClientAddress('bc1qabc')
    expect(httpClient.setHeaders).toHaveBeenLastCalledWith(
      expect.objectContaining({ 'x-address': 'bc1qabc' })
    )

    await service.setEndpoint('https://another.test')
    expect(httpClient.setBaseURL).toHaveBeenLastCalledWith('https://another.test')
  })

  it('resetAllData rewrites storage and clears x-address header', async () => {
    const storage = {
      createPersistentProxy: vi
        .fn()
        .mockResolvedValueOnce({ deviceId: 'oldid' })
        .mockResolvedValueOnce({ deviceId: 'newid' }),
      set: vi.fn().mockResolvedValue(undefined),
    }

    const httpClient = {
      get: vi.fn(),
      post: vi.fn(),
      setBaseURL: vi.fn(),
      setHeaders: vi.fn(),
    }

    const service = new WalletApiService()
    await service.init({ storage: storage as any, httpClient: httpClient as any })
    await service.setClientAddress('bc1qabc')

    await service.resetAllData()

    expect(storage.set).toHaveBeenCalledWith('openapi', { deviceId: 'device123456' })
    expect(PlatformEnv.UDID).toBe('newid')
    expect(httpClient.setHeaders).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ 'x-address': 'bc1qabc' })
    )
  })
})
