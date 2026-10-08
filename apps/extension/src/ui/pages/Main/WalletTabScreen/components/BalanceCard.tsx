import { Column, Icon, Row, Text, Tooltip } from '@/ui/components';
import { BtcUsd } from '@/ui/components/BtcUsd';
import { RefreshButton } from '@/ui/components/RefreshButton';
import { fontSizes } from '@/ui/theme/font';
import { useBalanceCardLogic } from '@unisat/wallet-state';

import { BtcDisplay } from './BtcDisplay';

export function BalanceCard() {
  const {
    totalBalance,
    availableAmount,
    unavailableAmount,
    unavailableTipText,
    balanceValue,
    chain,
    t,
    isCurrentChainBalance,

    isDetailExpanded,
    handleExpandToggle,

    isBalanceHidden,
    handleHiddenToggle,

    refreshBalance
  } = useBalanceCardLogic();

  const stopCardToggle = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
  };

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
      }}
      onClick={() => {
        handleExpandToggle();
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
            <Row
              style={{ padding: 6, margin: -6 }}
              onClick={(event) => {
                stopCardToggle(event);
                handleHiddenToggle();
              }}>
              <Icon color={'black_muted'} icon={isBalanceHidden ? 'balance-eyes-closed' : 'balance-eyes'} size={20} />
            </Row>
            <RefreshButton onClick={refreshBalance as any} hideText />
          </Row>
        </Row>

        <Row itemsCenter>
          <BtcDisplay balance={balanceValue} hideBalance={isBalanceHidden} />
          <Icon color={'black_muted'} size={16} icon={isDetailExpanded ? 'up' : 'down'} />
        </Row>

        {isCurrentChainBalance && (
          <BtcUsd color={'black_muted'} sats={totalBalance} size={'md'} hideBalance={isBalanceHidden} />
        )}
      </Column>

      {isDetailExpanded && isCurrentChainBalance && (
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
          <Column style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }} gap="xs">
            <Row itemsCenter gap="xs" style={{ height: 20 }}>
              <Text
                color={'black_65'}
                size="xs"
                text={t('available')}
                style={{ fontWeight: 500, lineHeight: '16px' }}
              />
              <div style={{ width: 16, height: 16, flexShrink: 0 }} />
            </Row>
            <BtcDisplay preset="sub" balance={availableAmount} hideBalance={isBalanceHidden} />
          </Column>

          <div
            style={{
              width: 1,
              alignSelf: 'stretch',
              backgroundColor: 'rgba(30, 58, 104, 0.15)',
              flexShrink: 0
            }}
          />

          <Column style={{ flex: 1, minWidth: 0, alignItems: 'flex-start' }} gap="xs">
            <Row itemsCenter gap="xs" style={{ height: 20 }}>
              <Text
                color={'black_65'}
                size="xs"
                text={t('unavailable')}
                style={{ fontWeight: 500, lineHeight: '16px' }}
              />
              <Tooltip
                title={unavailableTipText}
                overlayStyle={{
                  fontSize: fontSizes.xs
                }}>
                <div style={{ display: 'flex', alignItems: 'center', width: 16, height: 16, flexShrink: 0 }}>
                  <Icon icon="balance-question" size={16} containerStyle={{ display: 'block', marginTop: -1 }} />
                </div>
              </Tooltip>
            </Row>
            <BtcDisplay preset="sub" balance={unavailableAmount} hideBalance={isBalanceHidden} />
          </Column>
        </Row>
      )}
    </Column>
  );
}
