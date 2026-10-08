import BigNumber from 'bignumber.js';
import { createPortal } from 'react-dom';

import { Button, Card, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { CopyableAddress } from '@/ui/components/CopyableAddress';
import { APP_OVERLAY_ROOT_ID } from '@/ui/components/Responsive';
import { AmountItem, HistoryItem } from '@/ui/pages/Wallet/HistoryScreen/index';
import { colors } from '@/ui/theme/colors';
import { useChain, useExplorerBaseUrl, useI18n } from '@unisat/wallet-state';
import { satoshisToBTC } from '@/ui/utils';

interface HistoryDetailProps {
  detail: HistoryItem;
  close: () => void;
}

export function HistoryDetail({ detail, close }: HistoryDetailProps) {
  const explorerBase = useExplorerBaseUrl();
  const chain = useChain();
  const isReceive = detail.type === 'receive';
  const { t } = useI18n();
  const overlayRoot = typeof document !== 'undefined' ? document.getElementById(APP_OVERLAY_ROOT_ID) : null;
  const detailView = (
    <Layout
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 'auto',
        height: 'auto',
        maxWidth: 'none',
        pointerEvents: 'auto',
        backgroundColor: colors.background
      }}>
      <Header onBack={close} title="Transaction Details" />
      <Content>
        <Card style={{ justifyContent: 'stretch' }} mt={'lg'}>
          <Column itemsCenter gap={'xl'} style={{ flex: 1 }}>
            {detail.confirmations > 0 ? (
              <>
                <Icon icon={'success'} size={40} />
                <Text text={t('transaction_success')} color={'green'} />
              </>
            ) : (
              <>
                <Icon icon={'warning'} size={40} color={'warning'} />
                <Text text={t('transaction_unconfirmed')} color={'warning'} />
              </>
            )}

            <Column itemsCenter>
              <AmountItem
                inDetail
                item={{
                  ticker: chain.unit,
                  value: new BigNumber(detail.btcAmount),
                  type: 'BTC',
                  div: 0,
                  symbol: chain.unit
                }}
              />
              {detail.extra.map((extraItem, index) => {
                return <AmountItem key={index} item={extraItem} inDetail />;
              })}
            </Column>
            <div
              style={{
                alignSelf: 'stretch',
                borderBottom: '1px dashed rgba(255, 255, 255, 0.10)'
              }}
            />
            <Column gap={'xl'} style={{ alignSelf: 'stretch' }}>
              <Row justifyBetween>
                <Text text={isReceive ? 'Received from' : 'Send To'} color={'textDim'} />
                <CopyableAddress address={detail.address} />
              </Row>
              <Row justifyBetween>
                <Text text={'Transaction ID'} color={'textDim'} />
                <CopyableAddress address={detail.txid} />
              </Row>
              {/*<Row justifyBetween>*/}
              {/*  <Text text={'Outputs'} color={'textDim'} />*/}
              {/*  <Row>*/}
              {/*    <Text*/}
              {/*      text={`${Number(Math.abs(satoshisToBTC(detail.outputValue))).toLocaleString('en', { minimumFractionDigits: 8 })}`}*/}
              {/*    ></Text>*/}
              {/*    <Text text={'BTC'} color={'textDim'} />*/}
              {/*  </Row>*/}
              {/*</Row>*/}
              <Row justifyBetween>
                <Text text={'Network fee'} color={'textDim'} />
                <Row>
                  <Text
                    text={`${Number(Math.abs(satoshisToBTC(detail.fee))).toLocaleString('en', {
                      minimumFractionDigits: 8
                    })}`}></Text>
                  <Text text={chain.unit} color={'textDim'} />
                </Row>
              </Row>
              <Row justifyBetween>
                <Text text={t('network_fee_rate')} color={'textDim'} />
                <Row>
                  <Text text={detail.feeRate}></Text>
                  <Text text={'lits/vB'} color={'textDim'} />
                </Row>
              </Row>
              <Row justifyBetween>
                <Text text={t('date')} color={'textDim'} />
                <Row>
                  <Text text={new Date(detail.timestamp).toLocaleString()} color={'textDim'} />
                </Row>
              </Row>
            </Column>
          </Column>
        </Card>

        {explorerBase && (
          <Column gap={'lg'} mt={'lg'}>
            <Button
              text={t('view_on_mempool')}
              preset={'primary'}
              onClick={() => {
                window.open(`${explorerBase}/tx/${detail.txid}`);
              }}
            />
          </Column>
        )}
      </Content>
    </Layout>
  );

  if (!overlayRoot) {
    return detailView;
  }

  return createPortal(detailView, overlayRoot);
}
