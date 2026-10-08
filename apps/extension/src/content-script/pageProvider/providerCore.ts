/**
 * Provider initialization and lifecycle management
 */
import { ethErrors, serializeError } from 'eth-rpc-errors';

import { MESSAGE_TYPE } from '@unisat/wallet-shared';
import { _providerPrivate, getCacheOrigin, requestMethodKey, setCacheOrigin } from './providerState';
import { $, domReadyCall } from './utils';

export const log = (event, ...args) => {
  if (process.env.NODE_ENV !== 'production') {
    // console.log(
    //   `%c [unilit] (${new Date().toTimeString().slice(0, 8)}) ${event}`,
    //   'font-weight: 600; background-color: #7d6ef9; color: white;',
    //   ...args
    // );
  }
};

export function tryDetectTab(provider: any): void {
  const origin = window.top?.location.origin;
  if (origin && getCacheOrigin() !== origin) {
    setCacheOrigin(origin);
    const icon =
      ($('head > link[rel~="icon"]') as HTMLLinkElement)?.href ||
      ($('head > meta[itemprop="image"]') as HTMLMetaElement)?.content;

    const name = document.title || ($('head > meta[name="title"]') as HTMLMetaElement)?.content || origin;
    _providerPrivate._bcm.request({
      method: 'tabCheckin',
      params: { icon, name }
    });
  }
}

export async function initializeProvider(provider: any): Promise<void> {
  document.addEventListener('visibilitychange', () => requestPromiseCheckVisibility());

  _providerPrivate._bcm
    .connect()
    .on(MESSAGE_TYPE.BCM_CHANNEL_TO_PAGE, (data) => handleBackgroundMessage(provider, data));

  tryDetectTab(provider);
  domReadyCall(() => {
    tryDetectTab(provider);
  });

  try {
    const { network, accounts, isUnlocked }: any = await provider[requestMethodKey]({
      method: 'getProviderState'
    });
    if (isUnlocked) {
      _providerPrivate._isUnlocked = true;
      _providerPrivate._state.isUnlocked = true;
    }
    provider.emit('connect', {});
    _providerPrivate._pushEventHandlers?.networkChanged({
      network
    });

    _providerPrivate._pushEventHandlers?.accountsChanged(accounts);
  } catch {
    //
  } finally {
    _providerPrivate._initialized = true;
    _providerPrivate._state.initialized = true;
    provider.emit('_initialized');
  }

  keepAlive(provider);
}

export function keepAlive(provider: any): void {
  provider[requestMethodKey]({
    method: 'keepAlive',
    params: {}
  }).then((v) => {
    setTimeout(() => {
      keepAlive(provider);
    }, 1000);
  });
}

export function requestPromiseCheckVisibility(): void {
  if (document.visibilityState === 'visible') {
    _providerPrivate._requestPromise.check(1);
  } else {
    _providerPrivate._requestPromise.uncheck(1);
  }
}

export function handleBackgroundMessage(provider: any, { event, data }): void {
  log('[push event]', event, data);
  if (_providerPrivate._pushEventHandlers?.[event]) {
    return _providerPrivate._pushEventHandlers[event](data);
  }

  provider.emit(event, data);
}

export async function requestMethod(data: any): Promise<any> {
  if (!data) {
    throw ethErrors.rpc.invalidRequest();
  }

  requestPromiseCheckVisibility();

  return _providerPrivate._requestPromise.call(() => {
    log('[request]', JSON.stringify(data, null, 2));
    return _providerPrivate._bcm
      .request(data)
      .then((res) => {
        log('[request: success]', data.method, res);
        return res;
      })
      .catch((err) => {
        log('[request: error]', data.method, serializeError(err));
        throw serializeError(err);
      });
  });
}
