/**
 * Provider window injection
 * Handles injecting the provider into the window object
 */

export function defineUnwritablePropertyIfPossible(o: any, p: string, value: any): void {
  const descriptor = Object.getOwnPropertyDescriptor(o, p);
  if (!descriptor || descriptor.writable) {
    if (!descriptor || descriptor.configurable) {
      Object.defineProperty(o, p, {
        value,
        writable: false
      });
    } else {
      o[p] = value;
    }
  } else {
    console.warn(`Failed to inject ${p}. Another script already locked that window property.`);
  }
}

export function createProviderProxy(provider: any, requestMethodKey: symbol): any {
  return new Proxy(provider, {
    deleteProperty: () => true,
    get: (target, prop) => {
      if (prop === '_events' || prop === '_eventsCount' || prop === '_maxListeners') {
        return target[prop];
      }

      // Block access to methods starting with underscore or Symbol methods
      if ((typeof prop === 'string' && prop.startsWith('_')) || prop === requestMethodKey) {
        console.warn(
          `[UniSat] Attempted access to private method: ${String(prop)} is not allowed for security reasons`
        );
        return undefined;
      }
      return target[prop];
    }
  });
}

export function injectProviderToWindow(provider: any): void {
  defineUnwritablePropertyIfPossible(window, 'unilit', provider);

  window.dispatchEvent(new Event('unilit#initialized'));
}
