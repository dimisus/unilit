import { CSSProperties, useEffect, useState } from 'react';

import { Button, Column, Content, Header, Icon, Layout, Row, Text } from '@/ui/components';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';
import { PlatformEnv, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL, UPDATE_URL } from '@unisat/wallet-shared';
import {
  useDeveloperMode,
  useI18n,
  useNavigation,
  useSetDeveloperModeCallback,
  useTools,
  useVersionInfo
} from '@unisat/wallet-state';

const linkButtonStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  justifyContent: 'space-between',
  height: 52,
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.16)',
  paddingLeft: 16,
  paddingRight: 12
};

const linkButtonTextStyle: CSSProperties = {
  textAlign: 'left',
  flex: 1,
  fontWeight: 400
};

export default function AboutUsScreen() {
  const nav = useNavigation();
  const versionInfo = useVersionInfo();
  const hasUpdate = versionInfo.latestVersion && versionInfo.latestVersion !== versionInfo.currentVesion;
  const { t } = useI18n();
  const tools = useTools();
  const developerMode = useDeveloperMode();
  const setDeveloperMode = useSetDeveloperModeCallback();

  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  useEffect(() => {
    if (tapCount >= 10) {
      const newMode = !developerMode;
      setDeveloperMode(newMode);
      tools.toastSuccess(newMode ? t('developer_mode_enabled') : t('developer_mode_disabled'));
      setTapCount(0);
    }
  }, [tapCount, developerMode, setDeveloperMode, tools, t]);

  const handleVersionTap = () => {
    const now = Date.now();
    const timeDiff = now - lastTapTime;

    if (timeDiff < 500) {
      setTapCount((prev) => prev + 1);
    } else {
      setTapCount(1);
    }

    setLastTapTime(now);
  };

  return (
    <Layout>
      <Header onBack={() => nav.goBack()} title={t('about_us')} />
      <Content style={{ padding: 2 }}>
        <Column gap="lg" style={{ padding: spacing.small }}>
          {/* Logo Section */}
          <Column itemsCenter style={{ marginTop: spacing.tiny }}>
            <Icon icon="aboutus" size={82} />
          </Column>

          {/* App Name */}
          <Column itemsCenter>
            <Text text="UniLit Wallet" preset="title-bold" size="xxl" />
          </Column>

          {/* Version Info */}
          <Column itemsCenter>
            <Text
              text={`${t('version')} ${PlatformEnv.VERSION}${developerMode ? ' (Dev)' : ''}`}
              preset="sub"
              color={developerMode ? 'gold' : 'textDim'}
              onClick={handleVersionTap}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            />
          </Column>

          {/* Update Status */}
          <Column itemsCenter>
            {hasUpdate ? (
              <Row
                style={{
                  borderRadius: 12,
                  border: `1px solid ${colors.gold}99`,
                  cursor: 'pointer',
                  width: 173,
                  height: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  gap: 0
                }}
                onClick={() => nav.navToUrl(UPDATE_URL)}>
                <Icon icon="arrowUp" size={14} />
                <Text text={t('about_new_update')} style={{ marginLeft: 3, whiteSpace: 'nowrap', color: colors.gold }} />
              </Row>
            ) : null}
          </Column>

          <Column gap="md" style={{ width: '100%', marginTop: spacing.large }}>
            <Button
              text={t('terms_of_service')}
              onClick={() => nav.navToUrl(TERMS_OF_SERVICE_URL)}
              RightAccessory={<Icon icon="arrow-right" size={16} color="textDim" />}
              textStyle={linkButtonTextStyle}
              style={linkButtonStyle}
            />
            <Button
              text={t('privacy_policy')}
              onClick={() => nav.navToUrl(PRIVACY_POLICY_URL)}
              RightAccessory={<Icon icon="arrow-right" size={16} color="textDim" />}
              textStyle={linkButtonTextStyle}
              style={linkButtonStyle}
            />
          </Column>
        </Column>
      </Content>
    </Layout>
  );
}
