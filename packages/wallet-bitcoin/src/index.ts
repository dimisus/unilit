// Bitcoin core exports
export { bitcoin, eccManager } from './bitcoin-core'
export type { ECPairInterface } from './bitcoin-core'

// Address utilities
export * from './address'
// Network utilities
export {
  legacyScriptHash,
  litecoinMainnet,
  litecoinRegtest,
  litecoinTestnet,
  toLegacyScriptNetwork,
  toNetworkType,
  toPsbtNetwork,
} from './network'

// Utilities
export { toXOnly, tweakSigner, validator, schnorrValidator } from './utils'

// Message signing
export * from './message'

// constants
export { UTXO_DUST } from './constants'
