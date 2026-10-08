import { ethErrors } from 'eth-rpc-errors';

import { UnilitProvider } from './index';
import ReadyPromise from '@/content-script/pageProvider/readyPromise';
import BroadcastChannelMessage from '@/shared/utils/message/broadcastChannelMessage';

class PushEventHandlers {
  provider: UnilitProvider;
  _providerPrivate:any;

  constructor(provider, _providerPrivate: {
    _selectedAddress: string | null;
    _network: string | null;
    _isConnected: boolean;
    _initialized: boolean;
    _isUnlocked: boolean;
    _pushEventHandlers: PushEventHandlers | null;
    _requestPromise: ReadyPromise;
    _bcm: BroadcastChannelMessage
  }) {
    this.provider = provider;
    this._providerPrivate = _providerPrivate;
  }

  _emit(event, data) {
    if (this._providerPrivate._initialized) {
      this.provider.emit(event, data);
    }
  }

  connect = (data) => {
    if (!this._providerPrivate._isConnected) {
      this._providerPrivate._isConnected = true;
      this._providerPrivate._state.isConnected = true;
      this._emit('connect', data);
    }
  };

  unlock = () => {
    this._providerPrivate._isUnlocked = true;
    this._providerPrivate._state.isUnlocked = true;
  };

  lock = () => {
    this._providerPrivate._isUnlocked = false;
  };

  disconnect = () => {
    this._providerPrivate._isConnected = false;
    this._providerPrivate._state.isConnected = false;
    this._providerPrivate._state.accounts = null;
    this._providerPrivate._selectedAddress = null;
    const disconnectError = ethErrors.provider.disconnected();

    this._emit('accountsChanged', []);
    this._emit('disconnect', disconnectError);
    this._emit('close', disconnectError);
  };

  accountsChanged = (accounts: string[]) => {
    if (accounts?.[0] === this._providerPrivate._selectedAddress) {
      return;
    }

    this._providerPrivate._selectedAddress = accounts?.[0];
    this._providerPrivate._state.accounts = accounts;
    this._emit('accountsChanged', accounts);
  };

  networkChanged = ({ network }) => {
    this.connect({});

    if (network !== this._providerPrivate._network) {
      this._providerPrivate._network = network;
      this._emit('networkChanged', network);
    }
  };
}

export default PushEventHandlers;
