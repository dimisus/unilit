import { useEffect } from 'react';

import { Button, Column, Content, Input, Layout, OnboardingColumn, Row, Text } from '@/ui/components';
import { onboardingContentStyle } from '@/ui/components/OnboardingColumn';
import { shouldLeavePasswordForMain } from '@/ui/pages/Account/createHDWalletComponents/onboardingBack';
import { colors } from '@/ui/theme/colors';
import { useCreatePasswordScreenLogic, useI18n, useIsUnlocked, useNavigation, useWallet } from '@unisat/wallet-state';

type Status = '' | 'error' | 'warning' | undefined;

export default function CreatePasswordScreen() {
  const {
    strongTextRenderData,
    matchTextRenderData,
    onClickConfirm,
    disabled,
    onConfirmPasswordChange,
    onPasswordChange
  } = useCreatePasswordScreenLogic();
  const { t } = useI18n();
  const nav = useNavigation();
  const wallet = useWallet();
  const unlockedState = useIsUnlocked();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let unlocked = unlockedState;
      let hasAccount = false;
      try {
        unlocked = unlocked || (await wallet.isUnlocked());
        const account = await wallet.getCurrentAccount();
        hasAccount = Boolean(account?.address);
      } catch {
        return;
      }
      if (cancelled) {
        return;
      }
      if (shouldLeavePasswordForMain({ unlocked, hasAccount })) {
        nav.replace('MainScreen');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nav, unlockedState, wallet]);

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!disabled && 'Enter' == e.key) {
      onClickConfirm();
    }
  };

  return (
    <Layout>
      <OnboardingColumn>
        <Content style={{ ...onboardingContentStyle, alignItems: 'center' }}>
          <Column gap="xl" style={{ width: '100%', maxWidth: 420, marginTop: 48 }}>
            <Text text={t('create_a_password')} preset="title-bold" textCenter data-testid="create-password-title" />
            <Text text={t('you_will_use_this_to_unlock_your_wallet')} preset="sub" textCenter />
            <Column>
              <Input
                preset="password"
                onChange={onPasswordChange}
                autoFocus={true}
                data-testid="create-password-input"
              />
              {strongTextRenderData && (
                <Column>
                  <Row>
                    <Text size="xs" text={t('password_strength')} />
                    <Text size="xs" text={strongTextRenderData.text} style={{ color: strongTextRenderData.color }} />
                  </Row>
                  {strongTextRenderData.tip ? <Text size="xs" preset="sub" text={strongTextRenderData.tip} /> : null}
                </Column>
              )}
            </Column>

            <Column>
              <Input
                preset="password"
                placeholder={t('confirm_password')}
                onChange={onConfirmPasswordChange}
                onKeyUp={(e) => handleOnKeyUp(e as any)}
                data-testid="create-password-confirm-input"
              />
              {matchTextRenderData && (
                <Row>
                  <Text size="xs" text={matchTextRenderData.text} style={{ color: colors.red }} />
                </Row>
              )}
            </Column>

            <Button
              disabled={disabled}
              text={t('continue')}
              preset="primary"
              onClick={onClickConfirm}
              data-testid="create-password-continue-button"
            />
          </Column>
        </Content>
      </OnboardingColumn>
    </Layout>
  );
}
