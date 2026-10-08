import { describe, expect, it } from 'vitest'
import { isAddressLikelyValid } from '../src/address'

describe('addressUtils', () => {
  it('valid address', async () => {
    const allAddresses = [
      'ltc1qq2z2wssazy76tfpucdd32r78xe7urcj28h9hw7', //  P2WPKH
      'tltc1qq2z2wssazy76tfpucdd32r78xe7urcj2s9x7a5', // testnet P2WPKH
      'MLec8k947kg64jXaKEr3tJH7mMjzvvVbhh', // P2SH-P2WPKH
      'QZMS1cXMoCP6cCeGWbWbmJTQoPoYauAbYG', // testnet P2SH-P2WPKH
      'ltc1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uqww4xwz', // P2TR
      'tltc1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uq9p3c3h', // testnet P2TR
      'ltc1pfees06t9sd', // Pay-to-Anchor
      'tltc1pfeesm9jvdt', // testnet Pay-to-Anchor
      'Lceqhx1EvYGtTEEXHst8eW1DtzVC29wtwe', // P2PKH
      'mxwqjnnPeuU5yY1yqJsDCQ9nYmicmGTBns', // testnet P2PKH
    ]
    for (const address of allAddresses) {
      const result = isAddressLikelyValid(address)
      if (!result) {
        throw new Error(`Address validation failed: ${address}`)
      }
      expect(result).toBe(true)
    }
  })

  it('invalid address', async () => {
    const allAddresses = [
      'bc1pfenqc0gyp0', // special short address, but not supported
    ]
    for (const address of allAddresses) {
      const result = isAddressLikelyValid(address) == false
      if (!result) {
        throw new Error(`Address validation failed: ${address}`)
      }
      expect(result).toBe(true)
    }
  })
})
