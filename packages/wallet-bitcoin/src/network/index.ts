import { NetworkType } from '@unisat/wallet-types'
import { bitcoin } from '../bitcoin-core'

/**
 * Litecoin network parameters from Litecoin Core chainparams.
 * Nested-segwit addresses use SCRIPT_ADDRESS2 (M… / Q…), which current
 * Litecoin wallets generate. Legacy SCRIPT_ADDRESS (3… / 2…) is still
 * accepted when decoding.
 *
 * BIP32 version bytes match Litecoin Core (xpub/xprv), not the older Ltub prefix.
 */
export const litecoinMainnet: bitcoin.Network = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'ltc',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
}

export const litecoinTestnet: bitcoin.Network = {
  messagePrefix: '\x19Litecoin Signed Message:\n',
  bech32: 'tltc',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x6f,
  scriptHash: 0x3a,
  wif: 0xef,
}

export const litecoinRegtest: bitcoin.Network = {
  ...litecoinTestnet,
  bech32: 'rltc',
}

/** Legacy P2SH version bytes (3… on mainnet, 2… on testnet/regtest). */
export const legacyScriptHash: Record<NetworkType, number> = {
  [NetworkType.MAINNET]: 0x05,
  [NetworkType.TESTNET]: 0xc4,
  [NetworkType.REGTEST]: 0xc4,
}

/**
 * Convert network type to a bitcoinjs-lib network for Litecoin.
 */
export function toPsbtNetwork(networkType: NetworkType) {
  if (networkType === NetworkType.MAINNET) {
    return litecoinMainnet
  } else if (networkType === NetworkType.TESTNET) {
    return litecoinTestnet
  } else {
    return litecoinRegtest
  }
}

export function toLegacyScriptNetwork(networkType: NetworkType): bitcoin.Network {
  return {
    ...toPsbtNetwork(networkType),
    scriptHash: legacyScriptHash[networkType],
  }
}

/**
 * Convert a bitcoinjs-lib network to network type.
 */
export function toNetworkType(network: bitcoin.Network) {
  if (network.bech32 === litecoinMainnet.bech32) {
    return NetworkType.MAINNET
  } else if (network.bech32 === litecoinTestnet.bech32) {
    return NetworkType.TESTNET
  } else {
    return NetworkType.REGTEST
  }
}
