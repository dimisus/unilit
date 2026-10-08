import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/react-query-persist-client';

import {
  ADDRESS_HISTORY_CACHE_BUSTER,
  ADDRESS_HISTORY_CACHE_MAX_AGE,
  ADDRESS_HISTORY_QUERY_KEY,
  queryClient
} from './queryClient';

const STORAGE_KEY = 'unilit.addressHistory';
const SAVE_WAIT = 1000;

function createAddressHistoryPersister(): Persister {
  let timer: number | undefined;
  let pending: PersistedClient | undefined;

  const write = (client: PersistedClient | undefined) => {
    if (!client) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
    } catch {
      // Quota or blocked storage. The in-memory cache still serves this session.
    }
  };

  return {
    persistClient: (client) => {
      pending = client;
      if (timer != null) return;
      write(pending);
      pending = undefined;
      timer = window.setTimeout(() => {
        timer = undefined;
        write(pending);
        pending = undefined;
      }, SAVE_WAIT);
    },
    restoreClient: () => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return undefined;
      return JSON.parse(raw) as PersistedClient;
    },
    removeClient: () => {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };
}

let started = false;

export async function startAddressHistoryCache() {
  if (started) return;
  started = true;

  const persister = createAddressHistoryPersister();
  try {
    await persistQueryClientRestore({
      queryClient,
      persister,
      maxAge: ADDRESS_HISTORY_CACHE_MAX_AGE,
      buster: ADDRESS_HISTORY_CACHE_BUSTER
    });
  } catch {
    // A corrupt cache is discarded inside restore.
  }

  try {
    persistQueryClientSubscribe({
      queryClient,
      persister,
      buster: ADDRESS_HISTORY_CACHE_BUSTER,
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          query.queryKey[0] === ADDRESS_HISTORY_QUERY_KEY && query.state.status === 'success'
      }
    });
  } catch {
    // The in-memory cache still serves this session.
  }
}
