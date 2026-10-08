import { describe, expect, it } from 'vitest'

import {
  ChainTypeEnum,
  WalletTypeEnum,
  isP2WPKH,
  isSupportedAddressType,
  isTaproot,
} from '../src'
import {
  ChainType,
  WalletType,
  isP2WPKH as coreIsP2WPKH,
  isSupportedAddressType as coreIsSupportedAddressType,
  isTaproot as coreIsTaproot,
} from '@unisat/wallet-connect'

describe('index re-exports', () => {
  it('re-exports chain and wallet enums from core package', () => {
    expect(ChainTypeEnum).toBe(ChainType)
    expect(WalletTypeEnum).toBe(WalletType)
  })

  it('re-exports address helper functions from core package', () => {
    expect(isP2WPKH).toBe(coreIsP2WPKH)
    expect(isTaproot).toBe(coreIsTaproot)
    expect(isSupportedAddressType).toBe(coreIsSupportedAddressType)

    expect(isSupportedAddressType('ltc1qabc')).toBe(true)
    expect(isSupportedAddressType('ltc1pabc')).toBe(true)
    expect(isSupportedAddressType('1legacy')).toBe(false)
  })
})
