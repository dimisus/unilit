import { useEffect, useRef } from 'react';

import { ADDRESS_HISTORY_QUERY_KEY } from '@/ui/query/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useExplorerBaseUrl, useFetchBalanceCallback } from '@unisat/wallet-state';

import { HistoryItem } from './historyItems';
import { fetchExplorerTxConfirmation, PolledTxStatus, UNCONFIRMED_TX_POLL_MS } from './txStatus';

function refreshBalance(fetchBalance: () => Promise<unknown>) {
  void fetchBalance().catch(() => undefined);
}

/** Reload the wallet once, after an open transaction goes from unconfirmed to confirmed. */
function useRefreshWalletWhenConfirmed(detail: HistoryItem) {
  const queryClient = useQueryClient();
  const fetchBalance = useFetchBalanceCallback();
  const wasUnconfirmed = useRef(detail.confirmations <= 0);
  const txid = useRef(detail.txid);

  useEffect(() => {
    if (txid.current !== detail.txid) {
      txid.current = detail.txid;
      wasUnconfirmed.current = detail.confirmations <= 0;
    }
    if (detail.confirmations <= 0) {
      wasUnconfirmed.current = true;
      return;
    }
    if (!wasUnconfirmed.current) return;

    wasUnconfirmed.current = false;
    refreshBalance(fetchBalance);
    void queryClient.invalidateQueries({ queryKey: [ADDRESS_HISTORY_QUERY_KEY] });
  }, [detail.confirmations, detail.txid, fetchBalance, queryClient]);
}

/** Poll the explorer while this transaction is unconfirmed, then update the open detail. */
export function useUnconfirmedTransaction(detail: HistoryItem, onUpdate: (detail: HistoryItem) => void) {
  const explorerBase = useExplorerBaseUrl();
  const fetchBalance = useFetchBalanceCallback();
  const waiting = Boolean(explorerBase) && detail.confirmations <= 0;

  const status = useQuery<PolledTxStatus>({
    queryKey: ['explorer-tx', explorerBase, detail.txid],
    enabled: waiting,
    retry: false,
    refetchInterval: (query) => (query.state.data?.confirmed ? false : UNCONFIRMED_TX_POLL_MS),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    queryFn: ({ signal }) => {
      if (!explorerBase) throw new Error('Missing explorer');
      return fetchExplorerTxConfirmation(explorerBase, detail.txid, signal);
    }
  });

  useRefreshWalletWhenConfirmed(detail);

  useEffect(() => {
    const next = status.data;
    if (!next?.confirmed || detail.confirmations > 0) return;
    onUpdate({
      ...detail,
      confirmations: next.confirmations,
      timestamp: next.confirmedAt ?? detail.timestamp
    });
  }, [status.data, detail, onUpdate]);

  useEffect(() => {
    if (!waiting || status.data?.confirmed || status.fetchStatus === 'fetching' || status.status === 'pending') return;
    refreshBalance(fetchBalance);
  }, [
    waiting,
    status.data,
    status.status,
    status.fetchStatus,
    status.dataUpdatedAt,
    status.errorUpdatedAt,
    fetchBalance
  ]);
}
