import { CSSProperties, useEffect, useRef, useState } from 'react';

import { Column, Row, Text } from '@/ui/components';
import { HistoryListItem } from '@/ui/pages/Wallet/HistoryScreen';
import { HistoryDetail } from '@/ui/pages/Wallet/HistoryScreen/HistoryDetail';
import { HistorySkeleton } from '@/ui/pages/Wallet/HistoryScreen/HistorySkeleton';
import { buildHistoryItems, HistoryItem } from '@/ui/pages/Wallet/HistoryScreen/historyItems';
import { useAddressHistoryFeed } from '@/ui/query/useAddressHistory';
import { spacing } from '@/ui/theme/spacing';
import { useAccountAddress, useI18n } from '@unisat/wallet-state';

import './WalletHistory.less';

const loadMoreButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'auto',
  minWidth: 64,
  height: 28,
  padding: '0 14px',
  margin: 0,
  borderRadius: 12,
  backgroundColor: 'transparent',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.45)',
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: 12,
  lineHeight: '16px',
  fontFamily: 'inherit',
  cursor: 'pointer',
  boxSizing: 'border-box'
};

export function WalletHistory() {
  const address = useAccountAddress();
  const { t } = useI18n();
  const history = useAddressHistoryFeed(address);
  const [detail, setDetail] = useState<HistoryItem>();
  const enterDelay = useRef(new Map<string, number>());
  const seeded = useRef(false);
  const trackedAddress = useRef(address);

  const items = buildHistoryItems(history.detail, address);

  if (trackedAddress.current !== address) {
    trackedAddress.current = address;
    enterDelay.current = new Map();
    seeded.current = false;
  }

  let batchIndex = 0;
  items.forEach((item) => {
    if (enterDelay.current.has(item.txid)) return;
    if (!seeded.current) {
      enterDelay.current.set(item.txid, -1);
      return;
    }
    enterDelay.current.set(item.txid, batchIndex * 45);
    batchIndex += 1;
  });
  if (items.length > 0) seeded.current = true;

  useEffect(() => {
    setDetail(undefined);
  }, [address]);

  const loadMore = () => {
    if (history.isFetchingMore) return;
    history.loadMore();
  };

  return (
    <>
      <Column style={{ gap: spacing.medium }}>
        <Text text={t('history')} color="textDim" size="sm" style={{ lineHeight: '14px' }} />
        {history.showSkeleton ? (
          <HistorySkeleton contained />
        ) : history.isError && items.length === 0 ? (
          <Row justifyCenter>
            <Text
              text={t('try_again')}
              color="textDim"
              textCenter
              onClick={() => {
                history.refetch();
              }}
            />
          </Row>
        ) : items.length === 0 ? (
          <Row justifyCenter>
            <Text text={t('this_account_has_no_transactions')} color="textDim" textCenter />
          </Row>
        ) : (
          <Column gap="zero">
            {items.map((item) => {
              const delay = enterDelay.current.get(item.txid) ?? -1;
              const animate = delay >= 0;
              return (
                <div
                  key={item.txid}
                  className={animate ? 'history-row history-row-enter' : 'history-row'}
                  style={animate ? { animationDelay: `${delay}ms` } : undefined}>
                  <HistoryListItem contained item={item} onClick={() => setDetail(item)} />
                </div>
              );
            })}
            {history.hasMore && (
              <Row justifyCenter style={{ marginTop: spacing.medium }}>
                <button type="button" onClick={loadMore} aria-busy={history.isFetchingMore} style={loadMoreButtonStyle}>
                  <span key={history.isFetchingMore ? 'loading' : 'label'} className="history-more-swap">
                    {history.isFetchingMore ? <span className="history-more-spinner" /> : t('more')}
                  </span>
                </button>
              </Row>
            )}
          </Column>
        )}
      </Column>
      {detail && (
        <HistoryDetail
          detail={detail}
          close={() => {
            setDetail(undefined);
          }}
        />
      )}
    </>
  );
}
