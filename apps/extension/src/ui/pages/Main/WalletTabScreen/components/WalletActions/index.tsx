import { CSSProperties, useEffect, useMemo, useState } from 'react';

import { Column, Row } from '@/ui/components';
import { Button, ButtonProps } from '@/ui/components/Button';
import { Icon } from '@/ui/components/Icon';
import { spacingGap } from '@/ui/theme/spacing';
import { TypeChain } from '@unisat/wallet-shared';
import {
  useCurrentAccountCapabilities,
  useI18n,
  useNavigation,
  useResetFeeRateBar,
  useResetUiTxCreateScreen
} from '@unisat/wallet-state';

import './index.less';

interface WalletActionsProps {
  chain: TypeChain;
}

type WalletActionItem = {
  key: string;
  label: string;
  icon: NonNullable<ButtonProps['icon']>;
  onClick: NonNullable<ButtonProps['onClick']>;
  disabled?: boolean;
  priority: number;
  overflowPreset?: ButtonProps['preset'];
  dataTestId: string;
};

const MAX_PRIMARY_ACTIONS = 4;
/** Matches the home column gap between cards. */
const ACTION_BUTTON_GAP = spacingGap.lg2;

/** Same surface as the fee option cards. Label size matches the history More button. */
const compactActionStyle: CSSProperties = {
  display: 'flex',
  flex: '1 1 0',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  width: 'auto',
  minWidth: 0,
  height: 64,
  padding: '0 16px',
  margin: 0,
  borderRadius: 12,
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: 12,
  lineHeight: '16px',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
};

export const actionButtonStyle = compactActionStyle;
export const actionButtonTextStyle = {
  fontSize: 12,
  lineHeight: '16px'
};

export const WalletActions = ({ chain }: WalletActionsProps) => {
  const [showOverflowActions, setShowOverflowActions] = useState(false);
  const nav = useNavigation();
  const resetUiTxCreateScreen = useResetUiTxCreateScreen();
  const resetFeeRateBar = useResetFeeRateBar();
  const { t } = useI18n();
  const accountCapabilities = useCurrentAccountCapabilities();

  const onReceiveClick = () => {
    nav.navigate('ReceiveScreen');
  };

  const onSendClick = () => {
    resetUiTxCreateScreen();
    resetFeeRateBar();
    nav.navigate('TxCreateScreen');
  };

  const actionItems = useMemo<WalletActionItem[]>(() => {
    const items: WalletActionItem[] = [
      {
        key: 'receive',
        label: t('receive'),
        icon: 'receive',
        onClick: onReceiveClick,
        priority: 1,
        dataTestId: 'receive-button'
      },
      {
        key: 'send',
        label: t('send'),
        icon: 'send',
        onClick: onSendClick,
        disabled: !accountCapabilities.canCreateSigningRequest,
        priority: 2,
        dataTestId: 'send-button'
      }
    ];

    return items;
  }, [accountCapabilities.canCreateSigningRequest, t]);

  const { primaryActions, overflowActions } = useMemo(() => {
    const items = actionItems.sort((a, b) => a.priority - b.priority);
    let primaryActions: WalletActionItem[] = [];
    let overflowActions: WalletActionItem[] = [];
    if (items.length <= MAX_PRIMARY_ACTIONS) {
      primaryActions = items;
    } else {
      primaryActions = items.slice(0, MAX_PRIMARY_ACTIONS - 1);
      overflowActions = items.slice(MAX_PRIMARY_ACTIONS - 1);
    }

    return {
      primaryActions,
      overflowActions
    };
  }, [actionItems]);

  useEffect(() => {
    setShowOverflowActions(false);
  }, [chain.enum, overflowActions.length]);

  const renderActionButton = (action: WalletActionItem) => (
    <button
      key={action.key}
      type="button"
      onClick={action.disabled ? undefined : action.onClick}
      disabled={action.disabled}
      data-testid={action.dataTestId}
      className="wallet-action"
      style={compactActionStyle}>
      <Icon icon={action.icon} size={18} />
      {action.label}
    </button>
  );

  return (
    <>
      <Column
        fullX
        style={{
          gap: ACTION_BUTTON_GAP,
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
        <Row style={{ gap: ACTION_BUTTON_GAP, width: '100%' }}>
          {primaryActions.map((action) => renderActionButton(action))}
          {overflowActions.length > 0 && (
            <Button
              text={t('more')}
              preset="home"
              icon="more"
              onClick={() => setShowOverflowActions((prev) => !prev)}
              style={compactActionStyle}
              textStyle={actionButtonTextStyle}
              max2Lines
              data-testid="more-button"
            />
          )}
        </Row>

        {showOverflowActions && overflowActions.length > 0 && (
          <Row style={{ gap: ACTION_BUTTON_GAP, width: '100%' }}>
            {/* add empty action place to align the overflow button to the right*/}
            {MAX_PRIMARY_ACTIONS - overflowActions.length > 0 && (
              <Button preset="home" full style={{ ...compactActionStyle, opacity: 0 }}></Button>
            )}
            {MAX_PRIMARY_ACTIONS - overflowActions.length > 1 && (
              <Button preset="home" full style={{ ...compactActionStyle, opacity: 0 }}></Button>
            )}
            {MAX_PRIMARY_ACTIONS - overflowActions.length > 2 && (
              <Button preset="home" full style={{ ...compactActionStyle, opacity: 0 }}></Button>
            )}

            {overflowActions.map((action) => renderActionButton(action))}
          </Row>
        )}
      </Column>
    </>
  );
};
