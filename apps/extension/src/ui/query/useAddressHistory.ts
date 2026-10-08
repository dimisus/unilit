import { useState } from 'react';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useChainType, useWallet } from '@unisat/wallet-state';

import {
  ADDRESS_HISTORY_GC_TIME,
  ADDRESS_HISTORY_QUERY_KEY,
  ADDRESS_HISTORY_REFETCH_INTERVAL,
  ADDRESS_HISTORY_STALE_TIME
} from './queryClient';

/** Shared with the history screen so a page loaded in one place is reused in the other. */
export const HISTORY_PAGE_SIZE = 20;
export const HISTORY_PREVIEW_SIZE = 10;

/** Survives leaving the home screen, so Settings and back keeps the expanded list. */
const shownByAccount = new Map<string, number>();

function accountHistoryKey(chainType: string, address: string) {
  return `${chainType}:${address}`;
}

const historyQueryOptions = {
  staleTime: ADDRESS_HISTORY_STALE_TIME,
  gcTime: ADDRESS_HISTORY_GC_TIME,
  refetchInterval: ADDRESS_HISTORY_REFETCH_INTERVAL,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  retry: 1
};

export function historyNeedsSkeleton(
  address: string,
  query: { data?: unknown; isError: boolean; isFetching: boolean }
) {
  return Boolean(address) && query.data == null && (!query.isError || query.isFetching);
}

export function useAddressHistoryPage(address: string, page: number, pageSize: number) {
  const wallet = useWallet();
  const chainType = useChainType();
  const start = (page - 1) * pageSize;

  return useQuery({
    queryKey: [ADDRESS_HISTORY_QUERY_KEY, 'page', chainType, address, start, pageSize],
    queryFn: () => wallet.getAddressHistory({ address, start, limit: pageSize }),
    enabled: Boolean(address),
    ...historyQueryOptions
  });
}

export function useAddressHistoryFeed(
  address: string,
  previewSize = HISTORY_PREVIEW_SIZE,
  pageSize = HISTORY_PAGE_SIZE
) {
  const wallet = useWallet();
  const chainType = useChainType();
  const accountKey = accountHistoryKey(chainType, address);
  const [shown, setShown] = useState(() => shownByAccount.get(accountHistoryKey(chainType, address)) ?? previewSize);
  const [shownFor, setShownFor] = useState(accountKey);
  let visibleCount = shown;
  if (accountKey !== shownFor) {
    visibleCount = shownByAccount.get(accountKey) ?? previewSize;
    setShownFor(accountKey);
    setShown(visibleCount);
  }

  const pagesNeeded = Math.max(1, Math.ceil(visibleCount / pageSize));
  const queries = useQueries({
    queries: Array.from({ length: pagesNeeded }, (_, index) => {
      const start = index * pageSize;
      return {
        queryKey: [ADDRESS_HISTORY_QUERY_KEY, 'page', chainType, address, start, pageSize],
        queryFn: () => wallet.getAddressHistory({ address, start, limit: pageSize }),
        enabled: Boolean(address),
        ...historyQueryOptions
      };
    })
  });

  const first = queries[0];
  const detail = queries.flatMap((query) => query.data?.detail ?? []).slice(0, visibleCount);

  const total = first?.data?.total ?? 0;
  const loadedCount = queries.reduce((sum, query) => sum + (query.data?.detail?.length ?? 0), 0);
  const isFetchingMore = queries.slice(1).some((query) => query.isFetching && !query.data);
  const lastPageCount = queries[queries.length - 1]?.data?.detail?.length ?? 0;
  const lastPageFull = lastPageCount === pageSize;
  const hasMore =
    loadedCount > 0 && (visibleCount < loadedCount || isFetchingMore || (visibleCount < total && lastPageFull));

  const loadMore = () => {
    const failed = queries.find((query) => query.isError && query.data == null);
    if (failed) {
      failed.refetch();
      return;
    }
    if (queries.some((query) => query.isFetching && query.data == null)) return;
    setShown((count) => {
      const next = count + previewSize;
      if (address) shownByAccount.set(accountKey, next);
      return next;
    });
  };

  return {
    detail,
    total,
    hasMore,
    isFetchingMore,
    loadMore,
    refetch: () => first?.refetch(),
    showSkeleton: historyNeedsSkeleton(address, {
      data: first?.data,
      isError: Boolean(first?.isError),
      isFetching: Boolean(first?.isFetching)
    }),
    isError: Boolean(first?.isError) && first?.data == null && !first?.isFetching
  };
}
