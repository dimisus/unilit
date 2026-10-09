import { describe, expect, it } from 'vitest'

import {
  clearOnboardingWalletCreated,
  isWalletExistedError,
  markOnboardingWalletCreated,
  ONBOARDING_WALLET_CREATED_KEY,
  resolveHdOnboardingBack,
  shouldLeavePasswordForMain,
  shouldLeaveWelcomeForMain,
  wasOnboardingWalletCreated,
} from '../../../apps/extension/src/ui/pages/Account/createHDWalletComponents/onboardingBack'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

describe('HD onboarding back', () => {
  it('opens the main view after the wallet has been created', () => {
    expect(resolveHdOnboardingBack({ walletCreated: true, fromUnlock: true })).toBe('main')
    expect(resolveHdOnboardingBack({ walletCreated: true, fromUnlock: false })).toBe('main')
  })

  it('keeps the pre-create exit so earlier steps are not forced to the main view', () => {
    expect(resolveHdOnboardingBack({ walletCreated: false, fromUnlock: true })).toBe('welcome')
    expect(resolveHdOnboardingBack({ walletCreated: false, fromUnlock: false })).toBe('history')
  })

  it('recognizes the duplicate-wallet error that traps the recovery phrase step', () => {
    expect(isWalletExistedError('Wallet existed.', 'Wallet existed.')).toBe(true)
    expect(isWalletExistedError('Error: Wallet existed.', 'Wallet existed.')).toBe(true)
    expect(isWalletExistedError('mnemonic phrase is invalid', 'Wallet existed.')).toBe(false)
    expect(isWalletExistedError(undefined, 'Wallet existed.')).toBe(false)
  })

  it('remembers a finished onboarding only until a new create starts', () => {
    const storage = memoryStorage()
    expect(wasOnboardingWalletCreated(storage)).toBe(false)
    markOnboardingWalletCreated(storage)
    expect(storage.getItem(ONBOARDING_WALLET_CREATED_KEY)).toBe('1')
    expect(wasOnboardingWalletCreated(storage)).toBe(true)
    clearOnboardingWalletCreated(storage)
    expect(wasOnboardingWalletCreated(storage)).toBe(false)
  })

  it('sends a finished password or welcome step to the main view', () => {
    expect(shouldLeavePasswordForMain({ unlocked: true, hasAccount: true })).toBe(true)
    expect(shouldLeavePasswordForMain({ unlocked: true, hasAccount: false })).toBe(false)
    expect(shouldLeavePasswordForMain({ unlocked: false, hasAccount: true })).toBe(false)
    expect(shouldLeaveWelcomeForMain({ walletCreated: true, hasAccount: true })).toBe(true)
    expect(shouldLeaveWelcomeForMain({ walletCreated: false, hasAccount: true })).toBe(false)
    expect(shouldLeaveWelcomeForMain({ walletCreated: true, hasAccount: false })).toBe(false)
  })
})
