/**
 * Address history from a mempool.space-compatible explorer (litecoinspace.org).
 * Litescribe does not implement /address/history.
 */

import type { TxHistoryInOutItem, TxHistoryItem } from '@unisat/wallet-shared'

const CHAIN_PAGE_SIZE = 25
const MAX_CHAIN_PAGES = 40

interface ExplorerPrevout {
  scriptpubkey_address?: string
  value?: number
}

interface ExplorerVin {
  prevout?: ExplorerPrevout | null
}

interface ExplorerVout {
  scriptpubkey_address?: string
  value?: number
}

interface ExplorerTx {
  txid: string
  size?: number
  weight?: number
  fee?: number
  vin?: ExplorerVin[]
  vout?: ExplorerVout[]
  status?: {
    confirmed?: boolean
    block_height?: number
    block_time?: number
  }
}

interface AddressStats {
  chain_stats?: { tx_count?: number }
  mempool_stats?: { tx_count?: number }
}

export interface ExplorerHistoryOptions {
  fetchImpl?: typeof fetch
  nowSeconds?: number
}

function explorerUrl(base: string, path: string): string {
  return `${base.replace(/\/$/, '')}${path}`
}

async function getJson(fetchImpl: typeof fetch, url: string): Promise<unknown> {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Explorer request failed (${response.status})`)
  }
  return response.json()
}

function asTxs(value: unknown): ExplorerTx[] {
  return Array.isArray(value) ? (value as ExplorerTx[]) : []
}

function toInOut(address: string | undefined, value: number | undefined): TxHistoryInOutItem {
  return {
    address: address || '',
    value: value || 0,
    inscriptions: [],
    runes: [],
    brc20: [],
  }
}

export function mapExplorerTx(tx: ExplorerTx, tipHeight: number, nowSeconds: number): TxHistoryItem {
  const height = tx.status?.confirmed && tx.status.block_height ? tx.status.block_height : 0
  const confirmations = height > 0 ? Math.max(0, tipHeight - height + 1) : 0
  const fee = tx.fee || 0
  const vsize = tx.weight ? Math.max(1, Math.ceil(tx.weight / 4)) : tx.size || 0
  const feeRate = vsize > 0 ? Math.round((fee / vsize) * 100) / 100 : 0
  const outputs = tx.vout || []

  return {
    txid: tx.txid,
    confirmations,
    height,
    timestamp: tx.status?.block_time || nowSeconds,
    size: tx.size || 0,
    feeRate,
    fee,
    outputValue: outputs.reduce((sum, output) => sum + (output.value || 0), 0),
    vin: (tx.vin || []).map(input =>
      toInOut(input.prevout?.scriptpubkey_address, input.prevout?.value)
    ),
    vout: outputs.map(output => toInOut(output.scriptpubkey_address, output.value)),
    types: [],
    methods: [],
  }
}

export async function getExplorerAddressHistory(
  mempoolSpaceUrl: string,
  params: { address: string; start: number; limit: number },
  options: ExplorerHistoryOptions = {}
): Promise<{ start: number; total: number; detail: TxHistoryItem[] }> {
  const fetchImpl = options.fetchImpl || fetch
  const addressPath = encodeURIComponent(params.address)
  const [summaryRaw, tipRaw] = await Promise.all([
    getJson(fetchImpl, explorerUrl(mempoolSpaceUrl, `/api/address/${addressPath}`)),
    getJson(fetchImpl, explorerUrl(mempoolSpaceUrl, '/api/blocks/tip/height')),
  ])

  const summary = (summaryRaw || {}) as AddressStats
  const tipHeight = typeof tipRaw === 'number' ? tipRaw : Number(tipRaw) || 0
  const total = (summary.chain_stats?.tx_count || 0) + (summary.mempool_stats?.tx_count || 0)
  const start = Math.max(0, params.start || 0)
  const limit = Math.max(0, params.limit || 0)

  if (limit === 0 || start >= total || total === 0) {
    return { start, total, detail: [] }
  }

  const needed = start + limit
  const collected = asTxs(
    await getJson(fetchImpl, explorerUrl(mempoolSpaceUrl, `/api/address/${addressPath}/txs/mempool`))
  )

  let lastSeen = ''
  for (let page = 0; page < MAX_CHAIN_PAGES && collected.length < needed; page++) {
    const path = lastSeen
      ? `/api/address/${addressPath}/txs/chain/${lastSeen}`
      : `/api/address/${addressPath}/txs/chain`
    const txs = asTxs(await getJson(fetchImpl, explorerUrl(mempoolSpaceUrl, path)))
    if (txs.length === 0) break
    const nextLast = txs[txs.length - 1]?.txid || ''
    if (!nextLast || nextLast === lastSeen) break
    collected.push(...txs)
    lastSeen = nextLast
    if (txs.length < CHAIN_PAGE_SIZE) break
  }

  const seen = new Set<string>()
  const unique = collected.filter(tx => {
    if (!tx?.txid || seen.has(tx.txid)) return false
    seen.add(tx.txid)
    return true
  })

  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000)
  return {
    start,
    total,
    detail: unique.slice(start, start + limit).map(tx => mapExplorerTx(tx, tipHeight, nowSeconds)),
  }
}
