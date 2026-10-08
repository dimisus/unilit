const BASE58_REGEX = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/

const BECH32_REGEX = /^[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/

const PAY_TO_ANCHOR_ADDRESSES = new Set([
  'ltc1pfees06t9sd',
  'tltc1pfeesm9jvdt',
  'rltc1pfees06p8ul',
])

/**
 * Validate if a Bitcoin address is likely valid.
 * This is a lightweight check, NOT a full validation with checksum.
 *
 * Length ranges:
 * - P2PKH/P2SH (Base58): 26-35 chars (L…, M…, 3…, m…, n…, 2…)
 * - P2WPKH (ltc1q/tltc1q): 43-44 chars (20-byte witness)
 * - P2TR (ltc1p/tltc1p): 63-64 chars (32-byte witness with bech32m)
 * - P2A: known Pay-to-Anchor address (2-byte witness v1 program)
 *
 * @param address - Bitcoin address to validate
 * @returns true if address format looks valid, false otherwise
 */
export function isAddressLikelyValid(address: string): boolean {
  if (!address) return false

  if (PAY_TO_ANCHOR_ADDRESSES.has(address.toLowerCase())) return true

  const first = address[0]

  // ---- P2PKH (L, m, n) ----
  if (first === 'L' || first === 'm' || first === 'n') {
    if (address.length < 26 || address.length > 35) return false
    return BASE58_REGEX.test(address)
  }

  // ---- P2SH (M, 3, Q, 2) ----
  if (first === 'M' || first === '3' || first === 'Q' || first === '2') {
    if (address.length < 26 || address.length > 35) return false
    return BASE58_REGEX.test(address)
  }

  // ---- Bech32/Bech32m family: must not mix case ----
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    return false
  }

  const lower = address.toLowerCase()

  // ---- Witness v0 (ltc1q / tltc1q / rltc1q): P2WPKH or P2WSH ----
  if (lower.startsWith('ltc1q') || lower.startsWith('tltc1q') || lower.startsWith('rltc1q')) {
    if (lower.length < 43 || lower.length > 74) return false
    return BECH32_REGEX.test(lower.slice(lower.indexOf('1') + 1))
  }

  // ---- Witness v1 (ltc1p / tltc1p / rltc1p): P2TR ----
  if (lower.startsWith('ltc1p') || lower.startsWith('tltc1p') || lower.startsWith('rltc1p')) {
    if (lower.length !== 63 && lower.length !== 64) return false
    return BECH32_REGEX.test(lower.slice(lower.indexOf('1') + 1))
  }

  return false
}

export const addressUtils = {
  isAddressLikelyValid,
}
