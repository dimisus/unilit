import { QueryClient } from '@tanstack/react-query';

export const ADDRESS_HISTORY_QUERY_KEY = 'addressHistory';

/** Matches the open-window poll so a return visit within that window can reuse the last result. */
export const ADDRESS_HISTORY_STALE_TIME = 30 * 1000;

/** Poll while a history view is mounted and the wallet window is visible. */
export const ADDRESS_HISTORY_REFETCH_INTERVAL = 30 * 1000;

/** Kept longer than the saved copy so a restored page is not dropped immediately. */
export const ADDRESS_HISTORY_GC_TIME = 15 * 60 * 1000;

export const ADDRESS_HISTORY_CACHE_MAX_AGE = 10 * 60 * 1000;

export const ADDRESS_HISTORY_CACHE_BUSTER = 'address-history-v1';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      gcTime: ADDRESS_HISTORY_GC_TIME
    }
  }
});
