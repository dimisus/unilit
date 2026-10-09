import React from 'react';

import { spacing } from '@/ui/theme/spacing';

export function FooterButtonContainer({ children }: { children: React.ReactNode }) {
  return <div style={{ width: '100%', marginTop: spacing.medium, marginBottom: spacing.medium }}>{children}</div>;
}
