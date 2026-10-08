/**
 * Sleep utility function
 * @param ms Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert hex string to base64
 * @param hex Hex string
 */
export function hexToBase64(hex: string): string {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/**
 * Check if address is P2WPKH (native segwit, starts with ltc1q or tltc1q)
 */
export function isP2WPKH(address: string): boolean {
  return address.startsWith('ltc1q') || address.startsWith('tltc1q') || address.startsWith('rltc1q');
}

/**
 * Check if address is Taproot (starts with ltc1p or tltc1p)
 */
export function isTaproot(address: string): boolean {
  return address.startsWith('ltc1p') || address.startsWith('tltc1p') || address.startsWith('rltc1p');
}

/**
 * Check if address is a supported type (P2WPKH or Taproot)
 */
export function isSupportedAddressType(address: string): boolean {
  return isP2WPKH(address) || isTaproot(address);
}
