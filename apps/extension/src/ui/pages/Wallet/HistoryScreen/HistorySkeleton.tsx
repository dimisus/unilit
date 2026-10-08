import { CSSProperties, ReactNode } from 'react';

import { Column, Row, Text } from '@/ui/components';
import { useChain, useI18n } from '@unisat/wallet-state';

import { formatHistoryWhen } from './historyItems';
import './HistorySkeleton.less';

function MeasuredBone({ children, radius = 4 }: { children: ReactNode; radius?: number }) {
  return (
    <span className="history-skeleton-text">
      <span className="history-skeleton-measure">{children}</span>
      <span className="history-skeleton-bone" style={{ borderRadius: radius }} />
    </span>
  );
}

function IconBone() {
  return <span className="history-skeleton-bone history-skeleton-icon" />;
}

const amountSample = Number(0).toLocaleString('en', { minimumFractionDigits: 8 });

function AmountBone({ unit }: { unit: string }) {
  return (
    <MeasuredBone>
      <Row gap="sm" itemsCenter>
        <Text text="-" />
        <Text text={amountSample} ellipsis size="xs" />
        <Text text={unit} ellipsis size="xs" />
      </Row>
    </MeasuredBone>
  );
}

function LabelBone({ text, preset, style }: { text: string; preset?: 'sub'; style?: CSSProperties }) {
  return (
    <MeasuredBone>
      <Text text={text} preset={preset} style={style} />
    </MeasuredBone>
  );
}

export function HistorySkeleton({ rows = 3, contained = false }: { rows?: number; contained?: boolean }) {
  const { t } = useI18n();
  const chain = useChain();
  const when = formatHistoryWhen(Date.now());
  const titles = [t('receive'), t('send')];

  return (
    <div aria-hidden="true" data-testid="history-skeleton">
      <Column gap="zero">
        {Array.from({ length: rows }, (_, index) => (
          <Row
            key={index}
            justifyBetween
            full
            style={{
              padding: contained ? '12px 0' : '12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
            <Row itemsCenter>
              <IconBone />
              <Column gap="sm">
                <LabelBone text={titles[index % titles.length]} />
                <LabelBone text={when} preset="sub" style={{ whiteSpace: 'nowrap' }} />
              </Column>
            </Row>
            <Column style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <AmountBone unit={chain.unit} />
            </Column>
          </Row>
        ))}
      </Column>
    </div>
  );
}
