import React, { useState } from 'react';

import { colors } from '@/ui/theme/colors';

export interface CheckboxChangeEvent {
  target: {
    checked: boolean;
  };
}

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (e: any) => void;
  style?: React.CSSProperties;
  checkedColor?: string;
  checkColor?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

const BOX_SIZE = 16;

export function Checkbox(props: CheckboxProps) {
  const {
    checked = false,
    onChange,
    style,
    checkedColor = colors.orange,
    checkColor = colors.white,
    disabled = false,
    children,
    className,
    'data-testid': dataTestId
  } = props;
  const [focused, setFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    onChange?.({
      target: {
        checked: e.target.checked
      }
    });
  };

  return (
    <label
      className={className}
      data-testid={dataTestId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        lineHeight: `${BOX_SIZE}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'relative',
          width: BOX_SIZE,
          height: BOX_SIZE,
          flex: `0 0 ${BOX_SIZE}px`,
          boxSizing: 'border-box',
          borderRadius: 4,
          border: `2px solid ${checked ? checkedColor : '#666666'}`,
          backgroundColor: checked ? checkedColor : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: focused && !disabled ? `0 0 0 2px ${colors.yellow_light}` : undefined
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          data-testid={dataTestId ? `${dataTestId}-input` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            margin: 0,
            padding: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            outline: 'none'
          }}
        />
        {checked ? (
          <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden focusable="false" style={{ display: 'block' }}>
            <path
              d="M1.2 4.1 3.7 6.6 8.8 1.4"
              fill="none"
              stroke={checkColor}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      {children}
    </label>
  );
}
