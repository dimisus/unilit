import { ChainType } from '@unisat/wallet-types'

import type { TypeChain } from './common'

type ExplorerChain = Pick<
  TypeChain,
  'enum' | 'mempoolSpaceUrl' | 'unisatExplorerUrl' | 'defaultExplorer'
>

export function normalizeExplorerBaseUrl(input: string): string {
  const trimmed = input.trim()
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Invalid explorer URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid explorer URL')
  }
  if (parsed.username || parsed.password) {
    throw new Error('Invalid explorer URL')
  }
  const path = parsed.pathname.replace(/\/+$/, '')
  return `${parsed.origin}${path}`
}

export function defaultExplorerBaseUrl(chain: ExplorerChain): string {
  const mempool = (chain.mempoolSpaceUrl || '').replace(/\/+$/, '')
  if (chain.enum === ChainType.BITCOIN_MAINNET || chain.defaultExplorer === 'mempool-space') {
    return mempool
  }
  return (chain.unisatExplorerUrl || mempool).replace(/\/+$/, '')
}

export function resolveExplorerBaseUrl(
  chain: ExplorerChain,
  overrides?: Record<string, string> | null
): string {
  const custom = overrides?.[chain.enum]?.trim()
  if (custom) {
    return normalizeExplorerBaseUrl(custom)
  }
  return defaultExplorerBaseUrl(chain)
}
