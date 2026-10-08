import BigNumber from 'bignumber.js';
import { useEffect, useMemo, useState } from 'react';

import { Column, Content, Header, Icon, Layout, Row, Text, Tooltip } from '@/ui/components';
import AssetTag from '@/ui/components/AssetTag';
import { Pagination } from '@/ui/components/Pagination';
import { HistoryDetail } from '@/ui/pages/Wallet/HistoryScreen/HistoryDetail';
import { HISTORY_PAGE_SIZE, historyNeedsSkeleton, useAddressHistoryPage } from '@/ui/query/useAddressHistory';
import { fontSizes } from '@/ui/theme/font';
import { ClockCircleFilled } from '@ant-design/icons';
import { bnUtils } from '@unisat/base-utils';
import { useAccountAddress, useChain, useI18n } from '@unisat/wallet-state';

import { HistorySkeleton } from './HistorySkeleton';
import { buildHistoryItems, ExtraItem, HistoryItem } from './historyItems';

export type { ExtraItem, HistoryItem };

interface HistoryListItemProps {
  item: HistoryItem;
  onClick: () => void;
  /** Parent already applies page padding, so the divider stays inside it. */
  contained?: boolean;
}

export function AmountItem({ item, inDetail }: { item: ExtraItem; inDetail?: boolean }) {
  const isReceived = item.value.isPositive();

  return (
    <Row gap={'sm'} style={{ flexWrap: 'wrap' }} justifyEnd={!inDetail} justifyCenter={inDetail} itemsCenter>
      {
        // item.type !== 'BTC' && <AssetTag type={item.type} small />
      }
      <Text text={isReceived ? '+' : '-'} color={isReceived ? 'green' : 'red'} />
      {item.type === 'BTC' && (
        <Text
          text={`${Number(item.value.abs().toNumber()).toLocaleString('en', { minimumFractionDigits: 8 })}`}
          ellipsis
          size={inDetail ? 'xl' : 'xs'}
        />
      )}
      {item.type === 'brc-20' && (
        <>
          <Text text={item.value.abs().toString()} ellipsis style={{ maxWidth: 200 }} size={inDetail ? 'xl' : 'xs'} />
        </>
      )}
      {item.type === 'Runes' && (
        <>
          <Tooltip
            title={item.ticker}
            overlayStyle={{
              fontSize: fontSizes.xs
            }}>
            <Text
              text={bnUtils.toDecimalAmount(item.value.abs().toString(), item.div)}
              ellipsis
              style={{ maxWidth: 200 }}
              size={inDetail ? 'xl' : 'xs'}
            />
          </Tooltip>
        </>
      )}
      <Text
        color={'textDim'}
        text={item.symbol || item.ticker}
        ellipsis
        style={{ maxWidth: inDetail ? undefined : 200 }}
        size={inDetail ? 'md' : 'xs'}
      />
      {item.type !== 'BTC' && inDetail && <AssetTag type={item.type} />}
    </Row>
  );
}

function formatHistoryWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function HistoryListItem({ item, onClick, contained }: HistoryListItemProps) {
  const { t } = useI18n();
  const chain = useChain();
  const isReceived = item.type === 'receive';
  const iconId = item.txid.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <Row
      clickable
      justifyBetween
      full
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: contained ? '12px 0' : '12px 16px'
      }}
      onClick={onClick}>
      <Row itemsCenter>
        {isReceived ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill={`url(#receive_${iconId})`} fillOpacity="0.12" />
            <path
              d="M21.9003 23.9965C22.5086 23.9965 23 23.505 23 22.8967V15.1985C23 14.5902 22.5086 14.0988 21.9003 14.0988C21.292 14.0988 20.8005 14.5902 20.8005 15.1985V20.2402L13.879 13.3221C13.4494 12.8925 12.7518 12.8925 12.3222 13.3221C11.8926 13.7517 11.8926 14.4493 12.3222 14.8789L19.2437 21.797H14.2021C13.5938 21.797 13.1023 22.2884 13.1023 22.8967C13.1023 23.505 13.5938 23.9965 14.2021 23.9965H21.9003Z"
              fill="#7CDB98"
            />
            <defs>
              <linearGradient
                id={`receive_${iconId}`}
                x1="30.75"
                y1="2.625"
                x2="3"
                y2="31.125"
                gradientUnits="userSpaceOnUse">
                <stop stopColor="#77EBCF" />
                <stop offset="1" stopColor="#60F9C6" />
              </linearGradient>
            </defs>
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill={`url(#send_${iconId})`} fillOpacity="0.15" />
            <path
              d="M23.9966 13.0997C23.9966 12.4914 23.5051 12 22.8968 12L15.1986 12C14.5903 12 14.0989 12.4914 14.0989 13.0997C14.0989 13.708 14.5903 14.1995 15.1986 14.1995L20.2403 14.1995L13.3222 21.121C12.8926 21.5506 12.8926 22.2482 13.3222 22.6778C13.7518 23.1074 14.4494 23.1074 14.879 22.6778L21.7971 15.7563L21.7971 20.7979C21.7971 21.4062 22.2885 21.8977 22.8968 21.8977C23.5051 21.8977 23.9966 21.4062 23.9966 20.7979L23.9966 13.0997Z"
              fill="#FF8474"
            />
            <defs>
              <linearGradient
                id={`send_${iconId}`}
                x1="30.75"
                y1="2.625"
                x2="3"
                y2="31.125"
                gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF7665" />
                <stop offset="1" stopColor="#FFA082" />
              </linearGradient>
            </defs>
          </svg>
        )}

        <Column gap={'sm'}>
          <Text text={isReceived ? t('receive') : t('send')} />
          <Text text={formatHistoryWhen(item.timestamp)} preset="sub" style={{ whiteSpace: 'nowrap' }} />
        </Column>
      </Row>
      <Column style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <AmountItem
          item={{
            ticker: chain.unit,
            value: new BigNumber(item.btcAmount),
            type: 'BTC',
            div: 0,
            symbol: chain.unit
          }}
        />
        {item.extra.map((extraItem, index) => {
          return <AmountItem key={index} item={extraItem} />;
        })}
      </Column>
    </Row>
  );
}

export default function HistoryScreen() {
  const address = useAccountAddress();
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<HistoryItem>();
  const { t } = useI18n();
  const history = useAddressHistoryPage(address, page, HISTORY_PAGE_SIZE);
  const showSkeleton = historyNeedsSkeleton(address, history);
  const historyItems = useMemo(
    () => (history.data ? buildHistoryItems(history.data.detail || [], address) : []),
    [history.data, address]
  );

  useEffect(() => {
    setDetail(undefined);
  }, [address]);

  return (
    <>
      <Layout>
        <Header
          onBack={() => {
            window.history.go(-1);
          }}
          title="History"
        />

        {showSkeleton ? (
          <Content style={{ padding: '0 0 16px' }}>
            <HistorySkeleton rows={4} />
          </Content>
        ) : history.isError && !history.data ? (
          <Content preset="middle">
            <Text
              text={t('try_again')}
              color="textDim"
              textCenter
              onClick={() => {
                history.refetch();
              }}
            />
          </Content>
        ) : historyItems.length === 0 ? (
          <Content preset="middle">
            <Column gap="lg">
              <Row justifyCenter>
                <Icon color="textDim">
                  <ClockCircleFilled />
                </Icon>
              </Row>
              <Text text={t('this_account_has_no_transactions')} color="textDim" textCenter />
            </Column>
          </Content>
        ) : (
          <Content style={{ padding: '0 0 16px' }}>
            <Column gap={'zero'}>
              {historyItems.map((item) => (
                <HistoryListItem key={item.txid} item={item} onClick={() => setDetail(item)} />
              ))}
            </Column>
            <Row justifyCenter mt="lg">
              <Pagination
                pagination={{
                  currentPage: page,
                  pageSize: HISTORY_PAGE_SIZE
                }}
                total={history.data?.total || 0}
                onChange={(pagination) => {
                  setPage(pagination.currentPage);
                }}
              />
            </Row>
          </Content>
        )}
      </Layout>
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
