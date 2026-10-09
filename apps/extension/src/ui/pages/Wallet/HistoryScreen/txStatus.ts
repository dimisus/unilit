/** Public explorer routes are polled at this pace, including an open unconfirmed transaction. */
export const UNCONFIRMED_TX_POLL_MS = 30_000;

interface PolledHistoryDetail {
  txid: string;
  confirmations: number;
  timestamp: number;
}

/** Keep an open transaction on the newer copy when a history poll returns one. */
export function latestHistoryDetail<T extends PolledHistoryDetail>(current: T | undefined, items: T[]): T | undefined {
  if (!current) return current;
  const next = items.find((item) => item.txid === current.txid);
  if (!next || next.confirmations < current.confirmations) return current;
  if (next.confirmations === current.confirmations && next.timestamp === current.timestamp) return current;
  return next;
}

export interface ExplorerTxStatus {
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
}

export function readExplorerTxStatus(body: unknown): ExplorerTxStatus {
  const status =
    body && typeof body === 'object'
      ? (body as { status?: { confirmed?: unknown; block_height?: unknown; block_time?: unknown } }).status
      : undefined;
  return {
    confirmed: status?.confirmed === true,
    blockHeight: typeof status?.block_height === 'number' ? status.block_height : undefined,
    blockTime: typeof status?.block_time === 'number' ? status.block_time : undefined
  };
}

/** At least one confirmation once the explorer reports the transaction in a block. */
export function confirmationCount(blockHeight: number | undefined, tipHeight: number): number {
  if (!blockHeight || blockHeight <= 0 || !Number.isFinite(tipHeight)) return 1;
  return Math.max(1, Math.trunc(tipHeight) - blockHeight + 1);
}

export interface PolledTxStatus {
  confirmed: boolean;
  confirmations: number;
  /** Milliseconds, when the explorer included a block time. */
  confirmedAt?: number;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function fetchTipHeight(base: string, signal?: AbortSignal): Promise<number> {
  try {
    const response = await fetch(`${base}/api/blocks/tip/height`, {
      headers: { Accept: 'application/json' },
      signal
    });
    if (!response.ok) return Number.NaN;
    return Number(await response.json());
  } catch (error) {
    if (isAbortError(error)) throw error;
    return Number.NaN;
  }
}

/** Read whether a transaction is in a block. Throws when the explorer request itself fails. */
export async function fetchExplorerTxConfirmation(
  explorerBase: string,
  txid: string,
  signal?: AbortSignal
): Promise<PolledTxStatus> {
  const base = explorerBase.replace(/\/+$/, '');
  const response = await fetch(`${base}/api/tx/${encodeURIComponent(txid)}`, {
    headers: { Accept: 'application/json' },
    signal
  });

  if (!response.ok) {
    throw new Error(`Explorer transaction request failed (${response.status})`);
  }

  const status = readExplorerTxStatus(await response.json());
  if (!status.confirmed) {
    return { confirmed: false, confirmations: 0 };
  }

  const tipHeight = await fetchTipHeight(base, signal);
  return {
    confirmed: true,
    confirmations: confirmationCount(status.blockHeight, tipHeight),
    confirmedAt: status.blockTime ? status.blockTime * 1000 : undefined
  };
}
