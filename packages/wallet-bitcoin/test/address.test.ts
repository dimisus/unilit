import { describe, it, expect, beforeAll } from 'vitest'
import { AddressType, NetworkType } from '@unisat/wallet-types'
import {
  addressToScriptPk,
  decodeAddress,
  getAddressType,
  isValidAddress,
  isPayToAnchorAddress,
  publicKeyToAddress,
  scriptPkToAddress,
} from '../src/address'

const p2wpkh_data = {
  pubkey: '02b602ad190efb7b4f520068e3f8ecf573823d9e2557c5229231b4e14b79bbc0d8',
  mainnet_address: 'ltc1qq2z2wssazy76tfpucdd32r78xe7urcj28h9hw7',
  testnet_address: 'tltc1qq2z2wssazy76tfpucdd32r78xe7urcj2s9x7a5',
}

const p2sh_data = {
  pubkey: '020690457248a4f4f3ba2568b88a252af0d9dcfd9e0394690cbb0d45f72c574ee6',
  mainnet_address: 'MLec8k947kg64jXaKEr3tJH7mMjzvvVbhh',
  testnet_address: 'QZMS1cXMoCP6cCeGWbWbmJTQoPoYauAbYG',
}

const p2tr_data = {
  pubkey: '0333bc88101f32b7ba799504d9340e77aedcf0ea3a047131737e5eb4e5bee23406',
  mainnet_address: 'ltc1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uqww4xwz',
  testnet_address: 'tltc1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uq9p3c3h',
}

const pay_to_anchor_data = {
  mainnet_address: 'ltc1pfees06t9sd',
  testnet_address: 'tltc1pfeesm9jvdt',
  script_pk: '51024e73',
}

const p2pkh_data = {
  pubkey: '025e8ae8f7d9891dc0e24a4c1e74b58570281d4d3da8a3240268e00f0faa5d74b9',
  mainnet_address: 'Lceqhx1EvYGtTEEXHst8eW1DtzVC29wtwe',
  testnet_address: 'mxwqjnnPeuU5yY1yqJsDCQ9nYmicmGTBns',
}

const invalid_data = {
  pubkey: '',
  mainnet_address: '',
  testnet_address: '',
}

describe('address', () => {
  describe('publicKeyToAddress', () => {
    beforeAll(async () => {})
    it('should generate P2WPKH addresses correctly', () => {
      expect(publicKeyToAddress(p2wpkh_data.pubkey, AddressType.P2WPKH, NetworkType.MAINNET)).toBe(
        p2wpkh_data.mainnet_address
      )

      expect(publicKeyToAddress(p2wpkh_data.pubkey, AddressType.P2WPKH, NetworkType.TESTNET)).toBe(
        p2wpkh_data.testnet_address
      )
    })

    it('should generate P2SH-P2WPKH addresses correctly', () => {
      expect(
        publicKeyToAddress(p2sh_data.pubkey, AddressType.P2SH_P2WPKH, NetworkType.MAINNET)
      ).toBe(p2sh_data.mainnet_address)

      expect(
        publicKeyToAddress(p2sh_data.pubkey, AddressType.P2SH_P2WPKH, NetworkType.TESTNET)
      ).toBe(p2sh_data.testnet_address)
    })

    it('should generate P2TR addresses correctly', () => {
      expect(publicKeyToAddress(p2tr_data.pubkey, AddressType.P2TR, NetworkType.MAINNET)).toBe(
        p2tr_data.mainnet_address
      )

      expect(publicKeyToAddress(p2tr_data.pubkey, AddressType.P2TR, NetworkType.TESTNET)).toBe(
        p2tr_data.testnet_address
      )
    })

    it('should generate P2PKH addresses correctly', () => {
      expect(publicKeyToAddress(p2pkh_data.pubkey, AddressType.P2PKH, NetworkType.MAINNET)).toBe(
        p2pkh_data.mainnet_address
      )

      expect(publicKeyToAddress(p2pkh_data.pubkey, AddressType.P2PKH, NetworkType.TESTNET)).toBe(
        p2pkh_data.testnet_address
      )
    })
  })

  describe('isValidAddress', () => {
    it('should validate P2WPKH addresses correctly', () => {
      expect(isValidAddress(p2wpkh_data.mainnet_address, NetworkType.MAINNET)).toBe(true)
      expect(isValidAddress(p2wpkh_data.testnet_address, NetworkType.TESTNET)).toBe(true)
    })

    it('should validate P2SH addresses correctly', () => {
      expect(isValidAddress(p2sh_data.mainnet_address, NetworkType.MAINNET)).toBe(true)
      expect(isValidAddress(p2sh_data.testnet_address, NetworkType.TESTNET)).toBe(true)
    })

    it('should validate P2TR addresses correctly', () => {
      expect(isValidAddress(p2tr_data.mainnet_address, NetworkType.MAINNET)).toBe(true)
      expect(isValidAddress(p2tr_data.testnet_address, NetworkType.TESTNET)).toBe(true)
    })

    it('should validate P2PKH addresses correctly', () => {
      expect(isValidAddress(p2pkh_data.mainnet_address, NetworkType.MAINNET)).toBe(true)
      expect(isValidAddress(p2pkh_data.testnet_address, NetworkType.TESTNET)).toBe(true)
    })

    it('should validate Pay-to-Anchor addresses correctly', () => {
      expect(isValidAddress(pay_to_anchor_data.mainnet_address, NetworkType.MAINNET)).toBe(true)
      expect(isValidAddress(pay_to_anchor_data.testnet_address, NetworkType.TESTNET)).toBe(true)
      expect(isValidAddress(pay_to_anchor_data.mainnet_address, NetworkType.TESTNET)).toBe(false)
      expect(isPayToAnchorAddress(pay_to_anchor_data.mainnet_address, NetworkType.MAINNET)).toBe(true)
    })

    it('should detect cross-network invalid addresses', () => {
      expect(isValidAddress(p2pkh_data.mainnet_address, NetworkType.TESTNET)).toBe(false)
      expect(isValidAddress(p2pkh_data.testnet_address, NetworkType.MAINNET)).toBe(false)
    })

    it('should detect invalid addresses', () => {
      expect(isValidAddress(invalid_data.mainnet_address, NetworkType.MAINNET)).toBe(false)
      expect(isValidAddress('invalid', NetworkType.MAINNET)).toBe(false)
      expect(isValidAddress('', NetworkType.MAINNET)).toBe(false)
    })
  })

  describe('getAddressType', () => {
    it('should detect P2WPKH address type', () => {
      expect(getAddressType(p2wpkh_data.mainnet_address, NetworkType.MAINNET)).toBe(
        AddressType.P2WPKH
      )
      expect(getAddressType(p2wpkh_data.testnet_address, NetworkType.TESTNET)).toBe(
        AddressType.P2WPKH
      )
    })

    it('should detect P2PKH address type', () => {
      expect(getAddressType(p2pkh_data.mainnet_address, NetworkType.MAINNET)).toBe(
        AddressType.P2PKH
      )
      expect(getAddressType(p2pkh_data.testnet_address, NetworkType.TESTNET)).toBe(
        AddressType.P2PKH
      )
    })

    it('should detect P2TR address type', () => {
      expect(getAddressType(p2tr_data.mainnet_address, NetworkType.MAINNET)).toBe(AddressType.P2TR)
      expect(getAddressType(p2tr_data.testnet_address, NetworkType.TESTNET)).toBe(AddressType.P2TR)
    })

    it('should detect P2SH address type', () => {
      expect(getAddressType(p2sh_data.mainnet_address, NetworkType.MAINNET)).toBe(
        AddressType.P2SH_P2WPKH
      )
      expect(getAddressType(p2sh_data.testnet_address, NetworkType.TESTNET)).toBe(
        AddressType.P2SH_P2WPKH
      )
    })
  })

  describe('decodeAddress', () => {
    const networks = [NetworkType.MAINNET, NetworkType.TESTNET]
    const networkNames = ['MAINNET', 'TESTNET']

    it('should handle unknown addresses', () => {
      expect(decodeAddress('invalid address').addressType).toBe(AddressType.UNKNOWN)
      expect(decodeAddress('ltc1qxxx').addressType).toBe(AddressType.UNKNOWN)
      expect(decodeAddress('').addressType).toBe(AddressType.UNKNOWN)
    })
  })

  describe('Pay-to-Anchor scripts', () => {
    it('converts addresses to and from the standard anchor output script', () => {
      const script = addressToScriptPk(pay_to_anchor_data.mainnet_address, NetworkType.MAINNET)
      expect(script.toString('hex')).toBe(pay_to_anchor_data.script_pk)
      expect(scriptPkToAddress(script, NetworkType.MAINNET)).toBe(pay_to_anchor_data.mainnet_address)
      expect(scriptPkToAddress(script, NetworkType.TESTNET)).toBe(pay_to_anchor_data.testnet_address)
    })
  })
})
