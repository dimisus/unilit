import { AddressType, NetworkType } from '@unisat/wallet-types'
import { bitcoin } from '../bitcoin-core'
import { toLegacyScriptNetwork, toPsbtNetwork } from '../network'

const PAY_TO_ANCHOR_PROGRAM = Buffer.from('4e73', 'hex')
const PAY_TO_ANCHOR_SCRIPT = Buffer.from('51024e73', 'hex')

export function isPayToAnchorAddress(address: string, networkType: NetworkType): boolean {
  try {
    const decoded = bitcoin.address.fromBech32(address)
    return (
      decoded.prefix === toPsbtNetwork(networkType).bech32 &&
      decoded.version === 1 &&
      decoded.data.equals(PAY_TO_ANCHOR_PROGRAM)
    )
  } catch {
    return false
  }
}

/**
 * Convert public key to bitcoin payment object.
 */
export function publicKeyToPayment(publicKey: string, type: AddressType, networkType: NetworkType) {
  const network = toPsbtNetwork(networkType)
  if (!publicKey) return null
  const pubkey = Buffer.from(publicKey, 'hex')
  if (type === AddressType.P2PKH) {
    return bitcoin.payments.p2pkh({
      pubkey,
      network,
    })
  } else if (type === AddressType.P2WPKH || type === AddressType.M44_P2WPKH) {
    return bitcoin.payments.p2wpkh({
      pubkey,
      network,
    })
  } else if (type === AddressType.P2TR || type === AddressType.M44_P2TR) {
    return bitcoin.payments.p2tr({
      internalPubkey: pubkey.slice(1, 33),
      network,
    })
  } else if (type === AddressType.P2SH_P2WPKH) {
    const data = bitcoin.payments.p2wpkh({
      pubkey,
      network,
    })
    return bitcoin.payments.p2sh({
      pubkey,
      network,
      redeem: data,
    })
  }
  return null
}

/**
 * Convert public key to bitcoin address.
 */
export function publicKeyToAddress(publicKey: string, type: AddressType, networkType: NetworkType) {
  const payment = publicKeyToPayment(publicKey, type, networkType)
  if (payment && payment.address) {
    return payment.address
  } else {
    return ''
  }
}

/**
 * Convert public key to bitcoin scriptPk.
 */
export function publicKeyToScriptPk(
  publicKey: string,
  type: AddressType,
  networkType: NetworkType
) {
  const payment = publicKeyToPayment(publicKey, type, networkType)
  if (!payment || !payment.output) {
    return ''
  }
  return payment.output.toString('hex')
}

function isLitecoinBech32(address: string) {
  return address.startsWith('ltc1') || address.startsWith('tltc1') || address.startsWith('rltc1')
}

export function decodeAddress(address: string) {
  const mainnet = toPsbtNetwork(NetworkType.MAINNET)
  const testnet = toPsbtNetwork(NetworkType.TESTNET)
  const regtest = toPsbtNetwork(NetworkType.REGTEST)
  const mainnetLegacy = toLegacyScriptNetwork(NetworkType.MAINNET)
  const testnetLegacy = toLegacyScriptNetwork(NetworkType.TESTNET)
  let decodeBase58: bitcoin.address.Base58CheckResult
  let decodeBech32: bitcoin.address.Bech32Result
  let networkType: NetworkType = NetworkType.MAINNET
  let addressType: AddressType = AddressType.UNKNOWN
  if (isLitecoinBech32(address)) {
    try {
      decodeBech32 = bitcoin.address.fromBech32(address)
      if (decodeBech32.prefix === mainnet.bech32) {
        networkType = NetworkType.MAINNET
      } else if (decodeBech32.prefix === testnet.bech32) {
        networkType = NetworkType.TESTNET
      } else if (decodeBech32.prefix === regtest.bech32) {
        networkType = NetworkType.REGTEST
      } else {
        networkType = NetworkType.MAINNET
      }
      if (decodeBech32.version === 0) {
        if (decodeBech32.data.length === 20) {
          addressType = AddressType.P2WPKH
        } else if (decodeBech32.data.length === 32) {
          addressType = AddressType.P2WSH
        }
      } else if (decodeBech32.version === 1) {
        if (decodeBech32.data.length === 32) {
          addressType = AddressType.P2TR
        }
      }
      return {
        networkType,
        addressType,
        dust: getAddressTypeDust(addressType),
      }
    } catch (e) {}
  } else {
    try {
      decodeBase58 = bitcoin.address.fromBase58Check(address)
      if (decodeBase58.version === mainnet.pubKeyHash) {
        networkType = NetworkType.MAINNET
        addressType = AddressType.P2PKH
      } else if (decodeBase58.version === testnet.pubKeyHash) {
        networkType = NetworkType.TESTNET
        addressType = AddressType.P2PKH
      } else if (
        decodeBase58.version === mainnet.scriptHash ||
        decodeBase58.version === mainnetLegacy.scriptHash
      ) {
        networkType = NetworkType.MAINNET
        addressType = AddressType.P2SH_P2WPKH
      } else if (
        decodeBase58.version === testnet.scriptHash ||
        decodeBase58.version === testnetLegacy.scriptHash
      ) {
        networkType = NetworkType.TESTNET
        addressType = AddressType.P2SH_P2WPKH
      }
      return {
        networkType,
        addressType,
        dust: getAddressTypeDust(addressType),
      }
    } catch (e) {}
  }

  return {
    networkType: NetworkType.MAINNET,
    addressType: AddressType.UNKNOWN,
    dust: 5460,
  }
}

function getAddressTypeDust(addressType: AddressType) {
  if (addressType === AddressType.P2WPKH || addressType === AddressType.M44_P2WPKH) {
    return 2940
  } else if (addressType === AddressType.P2TR || addressType === AddressType.M44_P2TR) {
    return 3300
  } else {
    return 5460
  }
}

/**
 * Get address type.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getAddressType(
  address: string,
  _networkType: NetworkType = NetworkType.MAINNET
): AddressType {
  return decodeAddress(address).addressType
}

/**
 * Convert scriptPk to address.
 */
export function scriptPkToAddress(
  scriptPk: string | Buffer,
  networkType: NetworkType = NetworkType.MAINNET
) {
  const network = toPsbtNetwork(networkType)
  const script = typeof scriptPk === 'string' ? Buffer.from(scriptPk, 'hex') : scriptPk

  if (script.equals(PAY_TO_ANCHOR_SCRIPT)) {
    return bitcoin.address.toBech32(PAY_TO_ANCHOR_PROGRAM, 1, network.bech32)
  }

  try {
    const address = bitcoin.address.fromOutputScript(script, network)
    return address
  } catch (e) {
    return ''
  }
}

function outputScriptForAddress(address: string, networkType: NetworkType): Buffer {
  const networks = [toPsbtNetwork(networkType), toLegacyScriptNetwork(networkType)]
  let lastError: unknown
  for (const network of networks) {
    try {
      return bitcoin.address.toOutputScript(address, network)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

export function addressToScriptPk(address: string, networkType: NetworkType): Buffer {
  if (isPayToAnchorAddress(address, networkType)) {
    return PAY_TO_ANCHOR_SCRIPT
  }

  try {
    return outputScriptForAddress(address, networkType)
  } catch (error) {
    throw new Error(`Invalid address: ${address}`)
  }
}

export function isValidAddress(address: string, networkType: NetworkType): boolean {
  if (!address) return false

  if (isPayToAnchorAddress(address, networkType)) return true

  try {
    outputScriptForAddress(address, networkType)
    return true
  } catch (error) {
    return false
  }
}
