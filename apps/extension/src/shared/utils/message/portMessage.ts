import { browserRuntimeConnect } from '@/background/webapi/browser';
import { MESSAGE_TYPE } from '@unisat/wallet-shared';

import Message from './index';

class PortMessage extends Message {
  port: any | null = null;
  listenCallback: any;

  constructor(port?: any) {
    super();

    if (port) {
      this.port = port;
    }
  }

  connect = (name?: string) => {
    this.port = browserRuntimeConnect(undefined, name ? { name } : undefined);
    this.port.onDisconnect.addListener(acknowledgePortClosed);
    this.port.onMessage.addListener(({ _type_, data }) => {
      if (_type_ === `${this._EVENT_PRE}${MESSAGE_TYPE.PM_BG_TO_CONTENT}`) {
        this.emit(MESSAGE_TYPE.PM_BG_TO_CONTENT, data);
        return;
      }

      if (_type_ === `${this._EVENT_PRE}${MESSAGE_TYPE.RESPONSE}`) {
        this.onResponse(data);
      }
    });

    return this;
  };

  listen = (listenCallback: any) => {
    if (!this.port) return;
    this.listenCallback = listenCallback;
    this.port.onDisconnect.addListener(acknowledgePortClosed);
    this.port.onMessage.addListener(({ _type_, data }) => {
      if (_type_ === `${this._EVENT_PRE}request`) {
        this.onRequest(data);
      }
    });

    return this;
  };

  send = (type, data) => {
    if (!this.port) return;
    try {
      this.port.postMessage({ _type_: `${this._EVENT_PRE}${type}`, data });
    } catch (e) {
      // DO NOTHING BUT CATCH THIS ERROR
    }
  };

  dispose = () => {
    this._dispose();
    const port = this.port;
    this.port = null;
    if (!port) return;
    try {
      port.disconnect();
    } catch {
      // The page may already have dropped the port, including into back/forward cache.
    }
  };
}

function acknowledgePortClosed() {
  try {
    void chrome.runtime?.lastError;
  } catch {
    // The extension context can be gone by the time the port closes.
  }
}

export default PortMessage;
