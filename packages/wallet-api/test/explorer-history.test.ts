import { describe, expect, it, vi } from 'vitest'

import { getExplorerAddressHistory } from '../src/services/explorer-history'

const BASE = 'https://litecoinspace.org'
const ADDRESS = 'ltc1qexample'

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
  } as any
}

function explorerFetch(routes: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    if (!(url in routes)) {
      throw new Error(`unexpected ${url}`)
    }
    return jsonResponse(routes[url])
  })
}

const confirmed = {
  txid: 'aa',
  size: 639,
  weight: 1263,
  fee: 78500,
  status: { confirmed: true, block_height: 100, block_time: 1_700_000_000 },
  vin: [
    { prevout: { scriptpubkey_address: 'Lfrom', value: 200000 } },
    { is_coinbase: false, prevout: null },
  ],
  vout: [
    { scriptpubkey_address: ADDRESS, value: 120000 },
    { scriptpubkey_address: 'Lchange', value: 1500 },
  ],
}

describe('getExplorerAddressHistory', () => {
  it('maps litecoinspace transactions into the wallet history page', async () => {
    const fetchImpl = explorerFetch({
      [`${BASE}/api/address/${ADDRESS}`]: {
        chain_stats: { tx_count: 2 },
        mempool_stats: { tx_count: 1 },
      },
      [`${BASE}/api/blocks/tip/height`]: 104,
      [`${BASE}/api/address/${ADDRESS}/txs/mempool`]: [
        {
          txid: 'mp',
          size: 140,
          weight: 560,
          fee: 281,
          status: { confirmed: false },
          vin: [{ prevout: { scriptpubkey_address: 'Lpending', value: 5000 } }],
          vout: [{ scriptpubkey_address: ADDRESS, value: 4719 }],
        },
      ],
      [`${BASE}/api/address/${ADDRESS}/txs/chain`]: [confirmed],
    })

    const page = await getExplorerAddressHistory(
      BASE,
      { address: ADDRESS, start: 0, limit: 5 },
      { fetchImpl: fetchImpl as any, nowSeconds: 1_700_000_100 }
    )

    expect(page.total).toBe(3)
    expect(page.detail.map(item => item.txid)).toEqual(['mp', 'aa'])
    expect(page.detail[0]).toMatchObject({
      confirmations: 0,
      height: 0,
      timestamp: 1_700_000_100,
      fee: 281,
      feeRate: 2.01,
    })
    expect(page.detail[1]).toMatchObject({
      confirmations: 5,
      height: 100,
      timestamp: 1_700_000_000,
      fee: 78500,
      feeRate: 248.42,
      outputValue: 121500,
      size: 639,
    })
    expect(page.detail[1].vin).toEqual([
      { address: 'Lfrom', value: 200000, inscriptions: [], runes: [], brc20: [] },
      { address: '', value: 0, inscriptions: [], runes: [], brc20: [] },
    ])
    expect(page.detail[1].vout[0].address).toBe(ADDRESS)
  })

  it('pages confirmed history until the requested window is filled', async () => {
    const firstPage = Array.from({ length: 25 }, (_, index) => ({
      txid: `c${index}`,
      fee: 100,
      weight: 400,
      size: 100,
      status: { confirmed: true, block_height: 50, block_time: 10 },
      vin: [],
      vout: [{ scriptpubkey_address: ADDRESS, value: 1 }],
    }))
    const secondPage = [
      {
        txid: 'c25',
        fee: 100,
        weight: 400,
        size: 100,
        status: { confirmed: true, block_height: 40, block_time: 9 },
        vin: [],
        vout: [],
      },
    ]

    const fetchImpl = explorerFetch({
      [`${BASE}/api/address/${ADDRESS}`]: {
        chain_stats: { tx_count: 26 },
        mempool_stats: { tx_count: 0 },
      },
      [`${BASE}/api/blocks/tip/height`]: 50,
      [`${BASE}/api/address/${ADDRESS}/txs/mempool`]: [],
      [`${BASE}/api/address/${ADDRESS}/txs/chain`]: firstPage,
      [`${BASE}/api/address/${ADDRESS}/txs/chain/c24`]: secondPage,
    })

    const page = await getExplorerAddressHistory(
      `${BASE}/`,
      { address: ADDRESS, start: 25, limit: 1 },
      { fetchImpl: fetchImpl as any, nowSeconds: 10 }
    )

    expect(page.detail.map(item => item.txid)).toEqual(['c25'])
    expect(page.detail[0].confirmations).toBe(11)
    expect(fetchImpl).toHaveBeenCalledWith(
      `${BASE}/api/address/${ADDRESS}/txs/chain/c24`,
      expect.anything()
    )
  })

  it('does not request transactions when the address has none', async () => {
    const fetchImpl = explorerFetch({
      [`${BASE}/api/address/${ADDRESS}`]: {
        chain_stats: { tx_count: 0 },
        mempool_stats: { tx_count: 0 },
      },
      [`${BASE}/api/blocks/tip/height`]: 10,
    })

    const page = await getExplorerAddressHistory(
      BASE,
      { address: ADDRESS, start: 0, limit: 5 },
      { fetchImpl: fetchImpl as any }
    )

    expect(page).toEqual({ start: 0, total: 0, detail: [] })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
})
