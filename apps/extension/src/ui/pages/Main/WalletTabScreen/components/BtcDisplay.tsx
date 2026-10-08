import { CSSProperties, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Column, Row, Text } from '@/ui/components';
import { typography } from '@/ui/theme/typography';
import NumberFlow, { NumberFlowGroup, useCanAnimate } from '@number-flow/react';
import type { NumberFlowElement } from '@number-flow/react';
import { useBtcDisplayLogic, useBTCUnit } from '@unisat/wallet-state';

import './BtcDisplay.less';

type Presets = keyof typeof $viewPresets;

const $viewPresets = {
  main: {
    mainPartSize: 28,
    subPartSize: 20,
    unitPartSize: 20,
    mainPartColor: '#000',
    subPartColor: 'rgba(0, 0, 0, 0.5)',
    unitPartColor: '#000',
    subPartMarginBottom: 2
  },
  sub: {
    mainPartSize: 12,
    subPartSize: 12,
    unitPartSize: 12,
    mainPartColor: '#000',
    subPartColor: 'rgba(0, 0, 0, 0.5)',
    unitPartColor: '#000',
    subPartMarginBottom: 0
  }
};

const AMOUNT_PATTERN = /^(\d+)\.(\d{8})$/;

type FlowPart = {
  value: number;
  minimumFractionDigits: number;
  minimumIntegerDigits?: number;
  suffix?: string;
};

type AmountParts = {
  head: FlowPart;
  tail: FlowPart;
  sats: bigint;
};

function parseAmountParts(balance: string, mainPart: string, subPart: string): AmountParts | null {
  const amount = AMOUNT_PATTERN.exec(balance);
  if (!amount || !/^\d+$/.test(subPart) || subPart.length < 1) {
    return null;
  }

  const headSource = mainPart.endsWith('.') ? mainPart.slice(0, -1) : mainPart;
  if (!/^\d+(\.\d+)?$/.test(headSource)) {
    return null;
  }

  const headDot = headSource.indexOf('.');
  const headFractionDigits = headDot === -1 ? 0 : headSource.length - headDot - 1;
  const head = Number(headSource);
  const tail = Number(subPart);
  if (!Number.isFinite(head) || !Number.isFinite(tail)) {
    return null;
  }

  return {
    sats: BigInt(amount[1] + amount[2]),
    head: {
      value: head,
      minimumFractionDigits: headFractionDigits,
      suffix: mainPart.endsWith('.') ? '.' : undefined
    },
    tail: {
      value: tail,
      minimumFractionDigits: 0,
      minimumIntegerDigits: subPart.length
    }
  };
}

function zeroAmount(parts: AmountParts): AmountParts {
  return {
    ...parts,
    sats: 0n,
    head: { ...parts.head, value: 0 },
    tail: { ...parts.tail, value: 0 }
  };
}

function sign(delta: bigint) {
  if (delta > 0n) return 1;
  if (delta < 0n) return -1;
  return 0;
}

function useAnimatedAmount(parts: AmountParts | null, countFromZero: boolean) {
  const canAnimate = useCanAnimate();
  const [display, setDisplay] = useState<AmountParts | null>(null);
  const trendRef = useRef(0);
  const prevSats = useRef(0n);
  const introduced = useRef(false);

  useLayoutEffect(() => {
    if (!parts) {
      setDisplay(null);
      introduced.current = false;
      prevSats.current = 0n;
      trendRef.current = 0;
      return;
    }

    if (!introduced.current) {
      introduced.current = true;
      if (!canAnimate || !countFromZero || parts.sats === 0n) {
        prevSats.current = parts.sats;
        trendRef.current = 0;
        setDisplay(parts);
        return;
      }

      trendRef.current = sign(parts.sats);
      setDisplay(zeroAmount(parts));
      const frame = requestAnimationFrame(() => {
        prevSats.current = parts.sats;
        setDisplay(parts);
      });
      return () => {
        cancelAnimationFrame(frame);
        if (prevSats.current === 0n) {
          introduced.current = false;
        }
      };
    }

    trendRef.current = sign(parts.sats - prevSats.current);
    prevSats.current = parts.sats;
    setDisplay(parts);
  }, [canAnimate, countFromZero, parts]);

  const trend = useCallback(() => trendRef.current, []);
  return { display, trend };
}

function numberStyle(fontSize: number, color: string, marginBottom = 0): CSSProperties {
  return {
    fontFamily: typography.primary.bold,
    fontSize,
    color,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    marginBottom,
    userSelect: 'none',
    // Keep the fade mask tight so the significant digits and the muted tail sit flush.
    '--number-flow-mask-width': '0.08em',
    '--number-flow-mask-height': '0.2em'
  } as CSSProperties;
}

function BalanceFlow({
  part,
  trend,
  style,
  className
}: {
  part: FlowPart;
  trend: () => number;
  style: CSSProperties;
  className?: string;
}) {
  const ref = useRef<NumberFlowElement>(null);

  useLayoutEffect(() => {
    const root = ref.current?.shadowRoot;
    if (!root || root.getElementById('unilit-number-flow-symbols')) {
      return;
    }
    const styleEl = document.createElement('style');
    styleEl.id = 'unilit-number-flow-symbols';
    // NumberFlow blends symbols with plus-lighter, which erases a dark decimal on this light card.
    styleEl.textContent = '.symbol__value{mix-blend-mode:normal}';
    root.appendChild(styleEl);
  });

  return (
    <NumberFlow
      ref={ref}
      className={className}
      value={part.value}
      locales="en-US"
      format={{
        useGrouping: false,
        minimumFractionDigits: part.minimumFractionDigits,
        maximumFractionDigits: part.minimumFractionDigits,
        minimumIntegerDigits: part.minimumIntegerDigits,
        currency: 'LTC'
      }}
      suffix={part.suffix}
      trend={trend}
      willChange
      style={style}
    />
  );
}

export function BtcDisplay({
  balance,
  hideBalance,
  preset
}: {
  balance: string;
  hideBalance?: boolean;
  preset?: Presets;
}) {
  const btcUnit = useBTCUnit();
  const $style = preset ? $viewPresets[preset] : $viewPresets['main'];
  const { totalAmountMainPart, totalAmountSubPart } = useBtcDisplayLogic(balance);
  const parts = useMemo(
    () => parseAmountParts(balance, totalAmountMainPart, totalAmountSubPart),
    [balance, totalAmountMainPart, totalAmountSubPart]
  );
  const { display, trend } = useAnimatedAmount(parts, preset !== 'sub');

  const hiddenComponent = (
    <Column justifyCenter>
      <Text
        text={'****'}
        preset="title-bold"
        size="xxl"
        style={{
          fontSize: $style.mainPartSize,
          color: $style.mainPartColor
        }}
      />
    </Column>
  );

  const unitComponent = (
    <Column justifyCenter mx="sm">
      <Text
        text={btcUnit}
        preset="title-bold"
        textCenter
        style={{
          fontSize: $style.unitPartSize,
          color: $style.unitPartColor,
          marginBottom: $style.subPartMarginBottom
        }}
      />
    </Column>
  );

  if (hideBalance) {
    return (
      <Row itemsCenter>
        {hiddenComponent}
        {preset !== 'sub' && unitComponent}
      </Row>
    );
  }

  if (!display) {
    return (
      <Row itemsEnd gap="zero">
        <Text
          text={totalAmountMainPart}
          preset="title-bold"
          style={{
            fontSize: $style.mainPartSize,
            color: $style.mainPartColor
          }}
        />
        <Text
          text={totalAmountSubPart}
          preset="title-bold"
          style={{
            fontSize: $style.subPartSize,
            color: $style.subPartColor,
            marginBottom: $style.subPartMarginBottom
          }}
        />
        {preset !== 'sub' && unitComponent}
      </Row>
    );
  }

  const showUnit = preset !== 'sub';
  // NumberFlow's mask padding makes a sibling ticker sit below the digits. A suffix shares their baseline.
  const tailPart = showUnit ? { ...display.tail, suffix: btcUnit } : display.tail;
  const tailStyle: CSSProperties = {
    ...numberStyle($style.subPartSize, $style.subPartColor, $style.subPartMarginBottom),
    ...(showUnit ? ({ '--unilit-unit-color': $style.unitPartColor } as CSSProperties) : {})
  };

  return (
    <Row itemsEnd gap="zero">
      <NumberFlowGroup>
        <BalanceFlow part={display.head} trend={trend} style={numberStyle($style.mainPartSize, $style.mainPartColor)} />
        <BalanceFlow
          part={tailPart}
          trend={trend}
          className={showUnit ? 'unilit-balance-unit' : undefined}
          style={tailStyle}
        />
      </NumberFlowGroup>
    </Row>
  );
}
