import { ReactEventHandler } from 'react';

import { IMAGE_SOURCE_MAP } from '@/shared/constant';
import { colors } from '@/ui/theme/colors';
import { fontSizes } from '@/ui/theme/font';
import { LoadingOutlined } from '@ant-design/icons';
import { numUtils } from '@unisat/base-utils';
import { AddressAssets } from '@unisat/wallet-shared';
import { useBTCUnit, useChain, useI18n } from '@unisat/wallet-state';

import { Card } from '../Card';
import { Column } from '../Column';
import { CopyableAddress } from '../CopyableAddress';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Row } from '../Row';
import { Text } from '../Text';

interface AddressTypeCardProps {
  label: string;
  address: string;
  checked: boolean;
  assets: AddressAssets;
  disabled?: boolean;
  onClick?: ReactEventHandler<HTMLDivElement>;
  'data-testid'?: string;
}
export function AddressTypeCard(props: AddressTypeCardProps) {
  const btcUnit = useBTCUnit();
  const { onClick, label, address, checked, assets, disabled = false, 'data-testid': dataTestId } = props;
  const hasVault = Boolean(assets.satoshis && assets.satoshis > 0);
  const { t } = useI18n();

  const chain = useChain();
  return (
    <Card
      px="zero"
      py="zero"
      gap="zero"
      rounded
      onClick={disabled ? undefined : onClick}
      data-testid={dataTestId}
      style={{ opacity: disabled ? 0.5 : undefined, cursor: disabled ? 'not-allowed' : undefined }}
    >
      <Column full style={{ minWidth: 0 }}>
        <Row itemsCenter justifyBetween px="md" py="md" gap="md">
          <Column full gap="sm" style={{ minWidth: 0 }}>
            <Text text={label} size="xs" disableTranslate />
            <CopyableAddress address={address} />
          </Column>
          {checked ? (
            <Icon
              icon="check"
              size={16}
              containerStyle={{ display: 'flex', alignItems: 'center', flexShrink: 0, alignSelf: 'center' }}
            />
          ) : null}
        </Row>
        {hasVault && (
          <Row justifyBetween bg="bg3" roundedBottom px="md" py="md">
            <Row justifyCenter>
              <Image src={IMAGE_SOURCE_MAP[chain.icon]} size={fontSizes.iconMiddle} />
              <Text text={`${assets.total_btc} ${btcUnit}`} color="yellow" />
            </Row>
            <Row>
              {assets.total_inscription > 0 && (
                <Text text={`${assets.total_inscription} ${t('inscriptions_capital')}`} color="gold" preset="bold" />
              )}
            </Row>
          </Row>
        )}
      </Column>
    </Card>
  );
}

interface AddressTypeCardProp2 {
  label: string;
  items: {
    address: string;
    path: string;
    satoshis: number;
  }[];
  checked: boolean;
  balanceLoading?: boolean;
  onClick?: ReactEventHandler<HTMLDivElement>;
  'data-testid'?: string;
}

export function AddressTypeCard2(props: AddressTypeCardProp2) {
  const btcUnit = useBTCUnit();
  const chain = useChain();
  const { onClick, label, items, checked, balanceLoading = false, 'data-testid': dataTestId } = props;
  return (
    <Card px="zero" py="zero" gap={'zero'} rounded onClick={onClick} data-testid={dataTestId}>
      <Row full itemsCenter px="md" py="md" gap="md" style={{ alignItems: 'center', minWidth: 0 }}>
        <Column full gap="sm" style={{ minWidth: 0 }}>
          <Text text={label} size="xs" disableTranslate />
          {items.map((v, index) => (
            <Column
              key={`${v.address}-${index}`}
              gap="zero"
              style={{
                minWidth: 0,
                paddingBottom: index === items.length - 1 ? 0 : 8,
                borderBottomWidth: items.length > 1 && index < items.length - 1 ? 1 : 0,
                borderBottomColor: colors.line2
              }}
            >
              <Row itemsCenter gap="sm">
                <CopyableAddress address={v.address} />
                {balanceLoading ? (
                  <LoadingOutlined
                    data-testid="address-balance-loading"
                    style={{ fontSize: fontSizes.xs, color: colors.textDim }}
                  />
                ) : null}
              </Row>
              <Row justifyBetween fullX itemsCenter>
                <Text text={`(${v.path})`} size="xs" color="textDim" disableTranslate wrap />
                {v.satoshis > 0 ? (
                  <Row justifyCenter gap="zero" itemsCenter>
                    <Image src={IMAGE_SOURCE_MAP[chain.icon]} size={fontSizes.iconMiddle} />
                    <Text text={`${numUtils.satoshisToAmount(v.satoshis)} ${btcUnit}`} color="yellow" size="xs" />
                  </Row>
                ) : null}
              </Row>
            </Column>
          ))}
        </Column>
        {checked ? (
          <Icon
            icon="check"
            size={16}
            containerStyle={{ display: 'flex', alignItems: 'center', flexShrink: 0, alignSelf: 'center' }}
          />
        ) : null}
      </Row>
    </Card>
  );
}
