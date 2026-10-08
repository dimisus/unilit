import { describe, expect, it } from 'vitest'

import { ChainType } from '@unisat/wallet-types'

import { defaultExplorerBaseUrl, normalizeExplorerBaseUrl, resolveExplorerBaseUrl } from '../src/constants/explorer'

const mainnet = {
  enum: ChainType.BITCOIN_MAINNET,
  mempoolSpaceUrl: 'https://litecoinspace.org',
  unisatExplorerUrl: 'https://litecoinspace.org',
  defaultExplorer: 'mempool-space' as const,
}

describe('explorer base url', () => {
  it('keeps a mempool origin and a testnet path', () => {
    expect(normalizeExplorerBaseUrl('https://litecoinspace.org/')).toBe('https://litecoinspace.org')
    expect(normalizeExplorerBaseUrl('https://litecoinspace.org/testnet/')).toBe(
      'https://litecoinspace.org/testnet'
    )
  })

  it('rejects urls that are not http(s)', () => {
    expect(() => normalizeExplorerBaseUrl('litecoinspace.org')).toThrow('Invalid explorer URL')
    expect(() => normalizeExplorerBaseUrl('javascript:alert(1)')).toThrow('Invalid explorer URL')
  })

  it('uses the saved url for the current chain and falls back to the default', () => {
    expect(resolveExplorerBaseUrl(mainnet, {})).toBe('https://litecoinspace.org')
    expect(
      resolveExplorerBaseUrl(mainnet, {
        [ChainType.BITCOIN_MAINNET]: 'https://mempool.example.com/',
      })
    ).toBe('https://mempool.example.com')
    expect(defaultExplorerBaseUrl(mainnet)).toBe('https://litecoinspace.org')
  })
})
