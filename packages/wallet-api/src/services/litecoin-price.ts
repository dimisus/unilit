/**
 * Litecoin USD price from public spot endpoints.
 * Coinbase is the primary source. Kraken is used only when Coinbase fails.
 * Overlapping calls share one request. The UI query decides when to refresh.
 */

const COINBASE_SPOT_URL = 'https://api.coinbase.com/v2/prices/LTC-USD/spot'
const KRAKEN_TICKER_URL = 'https://api.kraken.com/0/public/Ticker?pair=LTCUSD'

export interface LitecoinPriceOptions {
  fetchImpl?: typeof fetch
}

let inflight: Promise<number> | null = null

export function clearLitecoinPriceCache() {
  inflight = null
}

export function parseCoinbaseSpot(body: unknown): number | null {
  const amount = (body as { data?: { amount?: unknown } } | null)?.data?.amount
  return positivePrice(amount)
}

export function parseKrakenTicker(body: unknown): number | null {
  const result = (body as { result?: Record<string, { c?: unknown[] }> } | null)?.result
  if (!result) return null
  const ticker = Object.values(result)[0]
  return positivePrice(ticker?.c?.[0])
}

function positivePrice(value: unknown): number | null {
  const price = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(price) || price <= 0) return null
  return price
}

async function readPrice(
  fetchImpl: typeof fetch,
  url: string,
  parse: (body: unknown) => number | null
): Promise<number | null> {
  try {
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    return parse(await response.json())
  } catch {
    return null
  }
}

export async function getLitecoinUsdPrice(options: LitecoinPriceOptions = {}): Promise<number> {
  const fetchImpl = options.fetchImpl || fetch
  if (!options.fetchImpl && inflight) {
    return inflight
  }

  const load = async () => {
    const usd =
      (await readPrice(fetchImpl, COINBASE_SPOT_URL, parseCoinbaseSpot)) ??
      (await readPrice(fetchImpl, KRAKEN_TICKER_URL, parseKrakenTicker))
    if (usd == null) {
      throw new Error('Litecoin price is unavailable')
    }
    return usd
  }

  if (options.fetchImpl) {
    return load()
  }

  inflight = load().finally(() => {
    inflight = null
  })
  return inflight
}
