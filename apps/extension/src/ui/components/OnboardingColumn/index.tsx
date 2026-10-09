import { CSSProperties, ReactNode } from 'react';

export const onboardingContentStyle: CSSProperties = {
  flex: 'none',
  overflowX: 'visible',
  overflowY: 'visible'
};

const $columnStyle: CSSProperties = {
  width: 'min(100%, 800px)',
  maxWidth: '100%',
  marginLeft: 'auto',
  marginRight: 'auto',
  alignSelf: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0
};

export function OnboardingColumn({ children }: { children: ReactNode }) {
  return (
    <div style={$columnStyle} data-testid="onboarding-column">
      {children}
    </div>
  );
}
