/** Session flag: this browser session already finished HD create/restore. */
export const ONBOARDING_WALLET_CREATED_KEY = 'unilit.onboardingWalletCreated';

type FlagStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function flagStorage(storage?: FlagStorage): FlagStorage {
  return storage ?? sessionStorage;
}

export function markOnboardingWalletCreated(storage?: FlagStorage) {
  flagStorage(storage).setItem(ONBOARDING_WALLET_CREATED_KEY, '1');
}

export function clearOnboardingWalletCreated(storage?: FlagStorage) {
  flagStorage(storage).removeItem(ONBOARDING_WALLET_CREATED_KEY);
}

export function wasOnboardingWalletCreated(storage?: FlagStorage) {
  return flagStorage(storage).getItem(ONBOARDING_WALLET_CREATED_KEY) === '1';
}

export type HdOnboardingBackTarget = 'main' | 'welcome' | 'history';

/**
 * Header back on the HD create/restore screen.
 * After the wallet is saved, leave for the main view.
 * Before that, keep the existing exit (welcome during first unlock, otherwise history).
 */
export function resolveHdOnboardingBack(input: {
  walletCreated: boolean;
  fromUnlock: boolean;
}): HdOnboardingBackTarget {
  if (input.walletCreated) {
    return 'main';
  }
  if (input.fromUnlock) {
    return 'welcome';
  }
  return 'history';
}

export function isWalletExistedError(message: string | undefined, translatedMessage: string): boolean {
  const normalized = (message ?? '').replace(/^Error:\s*/, '').trim();
  const translated = translatedMessage.trim();
  if (!normalized) {
    return false;
  }
  return normalized === translated || normalized === 'Wallet existed.';
}

/** Password step after a wallet already exists should open the main view. */
export function shouldLeavePasswordForMain(input: { unlocked: boolean; hasAccount: boolean }): boolean {
  return input.unlocked && input.hasAccount;
}

/** Welcome is only skipped when this session already finished onboarding and an account exists. */
export function shouldLeaveWelcomeForMain(input: { walletCreated: boolean; hasAccount: boolean }): boolean {
  return input.walletCreated && input.hasAccount;
}
