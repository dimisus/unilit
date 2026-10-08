import BigNumber from 'bignumber.js';

import { satoshisToBTC } from '@/ui/utils';
import { TxHistoryItem } from '@unisat/wallet-shared';

export interface ExtraItem {
  ticker: string;
  value: BigNumber;
  symbol: string;
  type: 'brc-20' | 'Runes' | 'BTC';
  div: number;
}

export interface HistoryItem {
  txid: string;
  address: string;
  type: 'receive' | 'send';
  btcAmount: number;
  extra: ExtraItem[];
  confirmations: number;
  feeRate: number;
  fee: number;
  outputValue: number;
  timestamp: number;
}

export function buildHistoryItems(detail: TxHistoryItem[], address: string): HistoryItem[] {
  return detail.map((v) => {
    let btcAmount = new BigNumber(0);
    const assetMap: { [key: string]: ExtraItem } = {};

    let fromAddress = '';
    let toAddress = '';

    v.vin.forEach((vin) => {
      if (vin.address === address) {
        btcAmount = btcAmount.minus(vin.value);
        if (vin.brc20) {
          vin.brc20.forEach((b) => {
            if (!assetMap[b.ticker]) {
              assetMap[b.ticker] = {
                ticker: b.ticker,
                value: new BigNumber(0),
                type: 'brc-20',
                symbol: '',
                div: 0
              };
            }
            assetMap[b.ticker].value = assetMap[b.ticker].value.minus(b.amount);
          });
        }

        if (vin.runes) {
          vin.runes.forEach((r) => {
            if (!assetMap[r.spacedRune]) {
              assetMap[r.spacedRune] = {
                ticker: r.spacedRune,
                value: new BigNumber(0),
                type: 'Runes',
                symbol: r.symbol,
                div: r.divisibility
              };
            }
            assetMap[r.spacedRune].value = assetMap[r.spacedRune].value.minus(r.amount);
          });
        }
      } else {
        fromAddress = vin.address;
      }
    });

    v.vout.forEach((vout) => {
      if (vout.address === address) {
        btcAmount = btcAmount.plus(vout.value);
        if (vout.brc20) {
          vout.brc20.forEach((b) => {
            if (!assetMap[b.ticker]) {
              assetMap[b.ticker] = {
                ticker: b.ticker,
                value: new BigNumber(0),
                type: 'brc-20',
                symbol: '',
                div: 0
              };
            }
            assetMap[b.ticker].value = assetMap[b.ticker].value.plus(b.amount);
          });
        }
        if (vout.runes) {
          vout.runes.forEach((r) => {
            if (!assetMap[r.spacedRune]) {
              assetMap[r.spacedRune] = {
                ticker: r.spacedRune,
                value: new BigNumber(0),
                type: 'Runes',
                symbol: r.symbol,
                div: r.divisibility
              };
            }
            assetMap[r.spacedRune].value = assetMap[r.spacedRune].value.plus(r.amount);
          });
        }
      } else {
        toAddress = vout.address;
      }
    });

    const extra: ExtraItem[] = [];
    for (const assetMapKey in assetMap) {
      extra.push(assetMap[assetMapKey]);
    }

    return {
      txid: v.txid,
      address: (btcAmount.isPositive() ? fromAddress : toAddress) || address,
      type: btcAmount.isPositive() ? 'receive' : 'send',
      btcAmount: satoshisToBTC(btcAmount.toNumber()),
      extra,
      confirmations: v.confirmations,
      feeRate: v.feeRate,
      fee: v.fee,
      outputValue: v.outputValue,
      timestamp: v.timestamp * 1000
    };
  });
}
