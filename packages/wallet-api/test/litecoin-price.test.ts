import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearLitecoinPriceCache,
  getLitecoinUsdPrice,
  parseCoinbaseSpot,
  parseKrakenTicker,
} from '../src/services/litecoin-price'

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 429,
    json: vi.fn().mockResolvedValue(body),
  } as any
}

afterEach(() => {
  clearLitecoinPriceCache()
  vi.unstubAllGlobals()
})

describe('litecoin price parsers', () => {
  it('reads the Coinbase spot amount', () => {
    expect(parseCoinbaseSpot({ data: { amount: '84.12' } })).toBe(84.12)
    expect(parseCoinbaseSpot({ data: { amount: '0' } })).toBeNull()
  })

  it('reads the Kraken last trade', () => {
    expect(parseKrakenTicker({ result: { XLTCZUSD: { c: ['81.5', '1'] } } })).toBe(81.5)
    expect(parseKrakenTicker({ error: ['EGeneral:Invalid arguments'] })).toBeNull()
  })
})

describe('getLitecoinUsdPrice', () => {
  it('uses Coinbase and does not call Kraken', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coinbase.com')) return jsonResponse({ data: { amount: '90' } })
      throw new Error(`unexpected ${url}`)
    })

    await expect(getLitecoinUsdPrice({ fetchImpl })).resolves.toBe(90)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('falls back to Kraken when Coinbase fails', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('coinbase.com')) return jsonResponse({}, false)
      if (url.includes('kraken.com')) {
        return jsonResponse({ result: { XLTCZUSD: { c: ['77.25', '2'] } } })
      }
      throw new Error(`unexpected ${url}`)
    })

    await expect(getLitecoinUsdPrice({ fetchImpl })).resolves.toBe(77.25)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight request', async () => {
    let release: (value: unknown) => void = () => {}
    const gate = new Promise(resolve => {
      release = resolve
    })
    const fetchImpl = vi.fn(() => gate.then(() => jsonResponse({ data: { amount: '70' } })))
    vi.stubGlobal('fetch', fetchImpl)

    const first = getLitecoinUsdPrice()
    const second = getLitecoinUsdPrice()
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    release(undefined)
    await expect(Promise.all([first, second])).resolves.toEqual([70, 70])
  })
})
