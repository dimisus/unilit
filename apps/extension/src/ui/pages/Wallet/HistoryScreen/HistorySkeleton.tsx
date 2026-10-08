import { Column, Row } from '@/ui/components';

import './HistorySkeleton.less';

const ROW_WIDTHS = [
  { title: 52, date: 72, amount: 64 },
  { title: 40, date: 84, amount: 72 },
  { title: 48, date: 68, amount: 56 }
];

function Bone({ width, height, radius = 4 }: { width: number; height: number; radius?: number }) {
  return <div className="history-skeleton-bone" style={{ width, height, borderRadius: radius }} />;
}

export function HistorySkeleton({ rows = 3, contained = false }: { rows?: number; contained?: boolean }) {
  return (
    <div aria-hidden="true" data-testid="history-skeleton">
      <Column gap="zero">
        {Array.from({ length: rows }, (_, index) => {
          const widths = ROW_WIDTHS[index % ROW_WIDTHS.length];
          return (
            <Row
              key={index}
              justifyBetween
              itemsCenter
              style={{
                padding: contained ? '10px 0' : '10px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}>
              <Row itemsCenter gap="sm">
                <Bone width={24} height={24} radius={6} />
                <Column gap="sm">
                  <Bone width={widths.title} height={8} />
                  <Bone width={widths.date} height={6} />
                </Column>
              </Row>
              <Bone width={widths.amount} height={8} />
            </Row>
          );
        })}
      </Column>
    </div>
  );
}
