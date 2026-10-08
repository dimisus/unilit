/**
 * Address balance, UTXOs, and broadcast from a mempool.space-compatible explorer.
 */

import type { AddressSummary, BitcoinBalance, BitcoinBalanceV2 } from '@unisat/wallet-shared'
import type { ChainType } from '@unisat/wallet-types'

export interface ExplorerStatsBucket {
  funded_txo_sum?: number
  spent_txo_sum?: number
  tx_count?: number
}

export interface ExplorerAddress {
  chain_stats?: ExplorerStatsBucket
  mempool_stats?: ExplorerStatsBucket
}

export interface ExplorerUtxo {
  txid: string
  vout: number
  value: number
  confirmed: boolean
}

export interface ExplorerChainOptions {
  fetchImpl?: typeof fetch
}

export function bucketNet(bucket?: ExplorerStatsBucket): number {
  return Math.trunc(Number(bucket?.funded_txo_sum) || 0) - Math.trunc(Number(bucket?.spent_txo_sum) || 0)
}

export function explorerBalances(address: ExplorerAddress) {
  const confirmed = bucketNet(address.chain_stats)
  const pending = bucketNet(address.mempool_stats)
  return {
    confirmed,
    pending,
    total: Math.max(0, confirmed + pending),
  }
}

export function satsToAmount(sats: number): string {
  const sign = sats < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(sats))
  const whole = Math.floor(abs / 100000000)
  const frac = String(abs % 100000000).padStart(8, '0')
  return `${sign}${whole}.${frac}`
}

export function toBitcoinBalance(address: ExplorerAddress): BitcoinBalance {
  const { confirmed, pending, total } = explorerBalances(address)
  const amount = satsToAmount(total)
  const confirmedAmount = satsToAmount(confirmed)
  const pendingAmount = satsToAmount(pending)
  return {
    confirm_amount: confirmedAmount,
    pending_amount: pendingAmount,
    amount,
    confirm_btc_amount: confirmedAmount,
    pending_btc_amount: pendingAmount,
    btc_amount: amount,
    confirm_inscription_amount: '0',
    pending_inscription_amount: '0',
    inscription_amount: '0',
    usd_value: '0',
  }
}

export function toBalanceV2(address: ExplorerAddress, chainType: ChainType): BitcoinBalanceV2 {
  const { total } = explorerBalances(address)
  return {
    availableBalance: total,
    unavailableBalance: 0,
    totalBalance: total,
    chainType,
  }
}

export function toAddressSummary(address: string, stats: ExplorerAddress): AddressSummary {
  const { total } = explorerBalances(stats)
  return {
    address,
    totalSatoshis: total,
    btcSatoshis: total,
    assetSatoshis: 0,
    inscriptionCount: 0,
    brc20Count: 0,
    brc20Count5Byte: 0,
    brc20Count6Byte: 0,
    runesCount: 0,
  }
}

export function mapExplorerUtxos(value: unknown): ExplorerUtxo[] {
  if (!Array.isArray(value)) return []
  const utxos: ExplorerUtxo[] = []
  for (const row of value) {
    const item = row as { txid?: unknown; vout?: unknown; value?: unknown; status?: { confirmed?: boolean } }
    const txid = typeof item?.txid === 'string' ? item.txid : ''
    const vout = Number(item?.vout)
    const satoshis = Number(item?.value)
    if (!txid || !Number.isInteger(vout) || vout < 0 || !Number.isFinite(satoshis)) continue
    utxos.push({
      txid,
      vout,
      value: satoshis,
      confirmed: item.status?.confirmed !== false,
    })
  }
  return utxos
}

function explorerUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}${path}`
}

async function readResponse(response: Response): Promise<string> {
  return typeof response.text === 'function' ? response.text() : ''
}

async function getJson(fetchImpl: typeof fetch, url: string): Promise<unknown> {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    const detail = (await readResponse(response)).trim()
    throw new Error(detail || `Explorer request failed (${response.status})`)
  }
  return response.json()
}

export async function getExplorerAddress(
  baseUrl: string,
  address: string,
  options: ExplorerChainOptions = {}
): Promise<ExplorerAddress> {
  const fetchImpl = options.fetchImpl || fetch
  const body = await getJson(
    fetchImpl,
    explorerUrl(baseUrl, `/api/address/${encodeURIComponent(address)}`)
  )
  return (body || {}) as ExplorerAddress
}

export async function getExplorerUtxos(
  baseUrl: string,
  address: string,
  options: ExplorerChainOptions = {}
): Promise<ExplorerUtxo[]> {
  const fetchImpl = options.fetchImpl || fetch
  const body = await getJson(
    fetchImpl,
    explorerUrl(baseUrl, `/api/address/${encodeURIComponent(address)}/utxo`)
  )
  return mapExplorerUtxos(body)
}

export async function broadcastExplorerTx(
  baseUrl: string,
  rawtx: string,
  options: ExplorerChainOptions = {}
): Promise<string> {
  const fetchImpl = options.fetchImpl || fetch
  const response = await fetchImpl(explorerUrl(baseUrl, '/api/tx'), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: rawtx,
  })
  const text = (await readResponse(response)).trim()
  if (!response.ok) {
    throw new Error(text || `Broadcast failed (${response.status})`)
  }
  if (!text) {
    throw new Error('Broadcast failed')
  }
  return text
}
