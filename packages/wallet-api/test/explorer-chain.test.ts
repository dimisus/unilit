import { describe, expect, it, vi } from 'vitest'

import { ChainType } from '@unisat/wallet-types'

import {
  broadcastExplorerTx,
  explorerBalances,
  getExplorerAddress,
  getExplorerUtxos,
  toBalanceV2,
  toBitcoinBalance,
} from '../src/services/explorer-chain'

const BASE = 'https://litecoinspace.org'
const ADDRESS = 'ltc1qexample'

function response(body: unknown, ok = true, status = 200) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    ok,
    status,
    text: vi.fn().mockResolvedValue(text),
    json: vi.fn().mockResolvedValue(body),
  } as any
}

describe('explorer chain data', () => {
  it('maps confirmed and pending litecoin into a spendable balance', () => {
    const stats = {
      chain_stats: { funded_txo_sum: 150000000, spent_txo_sum: 50000000 },
      mempool_stats: { funded_txo_sum: 20000000, spent_txo_sum: 0 },
    }
    expect(explorerBalances(stats)).toEqual({ confirmed: 100000000, pending: 20000000, total: 120000000 })
    expect(toBitcoinBalance(stats)).toMatchObject({
      confirm_amount: '1.00000000',
      pending_amount: '0.20000000',
      amount: '1.20000000',
      inscription_amount: '0',
    })
    expect(toBalanceV2(stats, ChainType.BITCOIN_MAINNET)).toEqual({
      availableBalance: 120000000,
      unavailableBalance: 0,
      totalBalance: 120000000,
      chainType: ChainType.BITCOIN_MAINNET,
    })
  })

  it('reduces the spendable balance when a confirmed output is spent in the mempool', () => {
    expect(
      explorerBalances({
        chain_stats: { funded_txo_sum: 100000000, spent_txo_sum: 0 },
        mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 40000000 },
      }).total
    ).toBe(60000000)
  })

  it('loads address stats and utxos from the mempool api', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === `${BASE}/api/address/${ADDRESS}`) {
        return response({
          chain_stats: { funded_txo_sum: 10, spent_txo_sum: 4 },
          mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 },
        })
      }
      if (url === `${BASE}/api/address/${ADDRESS}/utxo`) {
        return response([
          { txid: 'aa', vout: 0, value: 6, status: { confirmed: true } },
          { txid: '', vout: 1, value: 1 },
        ])
      }
      throw new Error(`unexpected ${url}`)
    })

    const stats = await getExplorerAddress(BASE, ADDRESS, { fetchImpl: fetchImpl as any })
    const utxos = await getExplorerUtxos(BASE, ADDRESS, { fetchImpl: fetchImpl as any })
    expect(explorerBalances(stats).total).toBe(6)
    expect(utxos).toEqual([{ txid: 'aa', vout: 0, value: 6, confirmed: true }])
  })

  it('broadcasts raw hex and surfaces the explorer error', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(`${BASE}/api/tx`)
      expect(init?.body).toBe('deadbeef')
      return response('txid123')
    })
    await expect(broadcastExplorerTx(BASE, 'deadbeef', { fetchImpl: fetchImpl as any })).resolves.toBe('txid123')

    const failing = vi.fn(async () => response('txn-mempool-conflict', false, 400))
    await expect(broadcastExplorerTx(BASE, 'deadbeef', { fetchImpl: failing as any })).rejects.toThrow(
      'txn-mempool-conflict'
    )
  })
})
