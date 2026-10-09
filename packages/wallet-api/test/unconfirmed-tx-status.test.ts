import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  confirmationCount,
  fetchExplorerTxConfirmation,
  latestHistoryDetail,
  readExplorerTxStatus,
} from '../../../apps/extension/src/ui/pages/Wallet/HistoryScreen/txStatus'

const open = { txid: 'aa', confirmations: 0, timestamp: 10, note: 'open' }

describe('unconfirmed transaction status', () => {
  it('reads a mempool transaction as unconfirmed', () => {
    expect(readExplorerTxStatus({ status: { confirmed: false } })).toEqual({
      confirmed: false,
      blockHeight: undefined,
      blockTime: undefined,
    })
  })

  it('counts confirmations from the block height', () => {
    const status = readExplorerTxStatus({
      status: { confirmed: true, block_height: 100, block_time: 1_700_000_000 },
    })
    expect(status.confirmed).toBe(true)
    expect(confirmationCount(status.blockHeight, 104)).toBe(5)
  })

  it('still counts one confirmation when the tip height is missing', () => {
    expect(confirmationCount(undefined, Number.NaN)).toBe(1)
  })

  it('keeps a confirmed open transaction ahead of a stale history row', () => {
    const confirmed = { ...open, confirmations: 1, timestamp: 20 }
    expect(latestHistoryDetail(confirmed, [open])).toBe(confirmed)
  })

  it('replaces the open transaction when history has a newer confirmation', () => {
    const newer = { ...open, confirmations: 2, timestamp: 30 }
    expect(latestHistoryDetail(open, [newer])).toBe(newer)
  })
})

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  }
}

describe('explorer transaction poll', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns unconfirmed without asking for the chain tip', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      expect(url).toBe('https://litecoinspace.org/api/tx/aa')
      return jsonResponse({ status: { confirmed: false } })
    })
    vi.stubGlobal('fetch', fetchImpl)

    await expect(fetchExplorerTxConfirmation('https://litecoinspace.org/', 'aa')).resolves.toEqual({
      confirmed: false,
      confirmations: 0,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('counts confirmations once the transaction is in a block', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/tx/')) {
          return jsonResponse({
            status: { confirmed: true, block_height: 100, block_time: 1_700_000_000 },
          })
        }
        return jsonResponse(104)
      })
    )

    await expect(fetchExplorerTxConfirmation('https://explorer.example', 'aa')).resolves.toEqual({
      confirmed: true,
      confirmations: 5,
      confirmedAt: 1_700_000_000_000,
    })
  })

  it('still confirms when the tip height cannot be read', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/tx/')) {
          return jsonResponse({
            status: { confirmed: true, block_height: 100, block_time: 1_700_000_000 },
          })
        }
        throw new Error('down')
      })
    )

    await expect(fetchExplorerTxConfirmation('https://explorer.example', 'aa')).resolves.toEqual({
      confirmed: true,
      confirmations: 1,
      confirmedAt: 1_700_000_000_000,
    })
  })

  it('throws when the transaction request fails so the poll can retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false, 500))
    )

    await expect(fetchExplorerTxConfirmation('https://explorer.example', 'aa')).rejects.toThrow(
      'Explorer transaction request failed (500)'
    )
  })
})
