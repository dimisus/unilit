import { useEffect, useState } from 'react';

import { Column, Icon, Row, Text } from '@/ui/components';
import { BtcUsd } from '@/ui/components/BtcUsd';
import { RefreshButton } from '@/ui/components/RefreshButton';
import { useAccountAddress, useBalanceCardLogic, useExplorerBaseUrl } from '@unisat/wallet-state';

import { BtcDisplay } from './BtcDisplay';

type UtxoCounts = {
  confirmed: number;
  unconfirmed: number;
};

function utxoApiUrl(explorerBase: string, address: string) {
  const base = explorerBase.replace(/\/+$/, '');
  return `${base}/api/address/${encodeURIComponent(address)}/utxo`;
}

function countUtxos(rows: unknown): UtxoCounts {
  const counts = { confirmed: 0, unconfirmed: 0 };
  if (!Array.isArray(rows)) return counts;
  for (const row of rows) {
    const confirmed = row && typeof row === 'object' ? (row as { status?: { confirmed?: boolean } }).status?.confirmed : undefined;
    if (confirmed === true) counts.confirmed += 1;
    else if (confirmed === false) counts.unconfirmed += 1;
  }
  return counts;
}

export function BalanceCard() {
  const {
    totalBalance,
    balanceValue,
    t,
    isCurrentChainBalance,

    isBalanceHidden,
    handleHiddenToggle,

    refreshBalance
  } = useBalanceCardLogic();
  const address = useAccountAddress();
  const explorerBase = useExplorerBaseUrl();
  const utxoUrl = explorerBase && address ? utxoApiUrl(explorerBase, address) : '';
  const [counts, setCounts] = useState<UtxoCounts | null>(null);

  useEffect(() => {
    if (!utxoUrl) {
      setCounts(null);
      return;
    }

    let cancelled = false;
    fetch(utxoUrl)
      .then((response) => {
        if (!response.ok) throw new Error('utxo request failed');
        return response.json();
      })
      .then((rows) => {
        if (!cancelled) setCounts(countUtxos(rows));
      })
      .catch(() => {
        if (!cancelled) setCounts(null);
      });

    return () => {
      cancelled = true;
    };
  }, [utxoUrl, totalBalance]);

  const confirmedValue = isBalanceHidden ? '****' : counts ? String(counts.confirmed) : '--';
  const unconfirmedValue = isBalanceHidden ? '****' : counts ? String(counts.unconfirmed) : '--';

  return (
    <Column
      style={{
        background: 'linear-gradient(117deg, #e7f0fb 1.38%, #6f93c4 94.19%)',
        borderRadius: 12,
        padding: 8,
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        alignSelf: 'stretch',
        overflow: 'hidden'
      }}>
      <Icon
        icon="unilit_logo"
        size={168}
        containerStyle={{
          position: 'absolute',
          right: -28,
          top: '50%',
          transform: 'translateY(-52%) rotate(16deg)',
          opacity: 0.28,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none'
        }}
      />
      <Column style={{ padding: 8, position: 'relative', zIndex: 1 }} gap={'md'}>
        <Row itemsCenter>
          <Text size="sm" text={t('total_balance')} style={{ color: 'rgba(0,0,0,0.55)' }} />
          <Row itemsCenter gap="sm">
            <Row style={{ padding: 6, margin: -6 }} onClick={handleHiddenToggle}>
              <Icon color={'black_muted'} icon={isBalanceHidden ? 'balance-eyes-closed' : 'balance-eyes'} size={20} />
            </Row>
            <RefreshButton onClick={refreshBalance as any} hideText />
          </Row>
        </Row>

        <Row itemsCenter>
          <BtcDisplay balance={balanceValue} hideBalance={isBalanceHidden} />
        </Row>

        {isCurrentChainBalance && (
          <BtcUsd color={'black_muted'} sats={totalBalance} size={'md'} hideBalance={isBalanceHidden} />
        )}
      </Column>

      {utxoUrl && (
        <Row
          style={{
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            padding: 12,
            backgroundColor: '#d3e3f6',
            borderRadius: 12,
            gap: 8,
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 1
          }}>
          <UtxoStat label={t('confirmed_utxos')} value={confirmedValue} href={utxoUrl} />
          <div
            style={{
              width: 1,
              alignSelf: 'stretch',
              backgroundColor: 'rgba(30, 58, 104, 0.15)',
              flexShrink: 0
            }}
          />
          <UtxoStat label={t('unconfirmed_utxos')} value={unconfirmedValue} href={utxoUrl} />
        </Row>
      )}
    </Column>
  );
}

function UtxoStat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ flex: 1, minWidth: 0, color: 'inherit', textDecoration: 'none' }}>
      <Column style={{ alignItems: 'flex-start' }} gap="xs">
        <Text color={'black_65'} size="xs" text={label} style={{ fontWeight: 500, lineHeight: '16px' }} />
        <Text text={value} style={{ fontWeight: 700, fontSize: 12, lineHeight: '16px', color: '#000' }} />
      </Column>
    </a>
  );
}
