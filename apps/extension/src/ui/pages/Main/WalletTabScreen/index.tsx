import { useEffect, useState } from 'react';

import { Card, Column, Content, Footer, Header, Layout, Row, Text } from '@/ui/components';
import AccountSelect from '@/ui/components/AccountSelect';
import LoadingPage from '@/ui/components/LoadingPage';
import { NavTabBar } from '@/ui/components/NavTabBar';
import { NoticePopover } from '@/ui/components/NoticePopover';
import { SwitchNetworkBar } from '@/ui/components/SwitchNetworkBar';
import { UpgradePopover } from '@/ui/components/UpgradePopover';
import { VersionNotice } from '@/ui/components/VersionNotice';
import { KeyringType } from '@unisat/keyring-service/types';
import { VersionDetail } from '@unisat/wallet-shared';
import '@unisat/wallet-state';
import {
  useChain,
  useCurrentAccount,
  useCurrentKeyring,
  useIsUnlocked,
  useNavigation,
  useSkipVersionCallback,
  useVersionInfo,
  useWallet
} from '@unisat/wallet-state';

import { useNavigate } from '../../MainRoute';
import { SwitchChainModal } from '../../Settings/SwitchChainModal';
import { SidePanelExpand } from './SidePanelExpand';
import { AnnouncementCard } from './components/AnnouncementCard';
import { BalanceCard } from './components/BalanceCard';
import { HomeTips } from './components/HomeTips';
import { WalletActions } from './components/WalletActions';
import { WalletHistory } from './components/WalletHistory';

const STORAGE_VERSION_KEY = 'version_detail';

export default function WalletTabScreen() {
  const navigate = useNavigate();

  const chain = useChain();

  const currentKeyring = useCurrentKeyring();
  const currentAccount = useCurrentAccount();

  const wallet = useWallet();

  const skipVersion = useSkipVersionCallback();

  const versionInfo = useVersionInfo();

  const [showSafeNotice, setShowSafeNotice] = useState(false);
  const [showVersionNotice, setShowVersionNotice] = useState<VersionDetail | null>(null);

  const nav = useNavigation();
  const isUnlocked = useIsUnlocked();

  useEffect(() => {
    if (!isUnlocked) {
      nav.navToLock({
        autoUnlockByFace: false
      });
    }
  }, [isUnlocked]);

  useEffect(() => {
    const run = async () => {
      const show = await wallet.getShowSafeNotice();
      setShowSafeNotice(show);
    };
    run();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        let needFetchVersionDetail = false;
        const item = localStorage.getItem(STORAGE_VERSION_KEY);
        let versionDetail: VersionDetail | undefined = undefined;
        if (!item) {
          needFetchVersionDetail = true;
        } else {
          versionDetail = JSON.parse(item || '{}');
          if (versionDetail && versionDetail.version !== versionInfo.currentVesion) {
            needFetchVersionDetail = true;
          }
        }
        if (needFetchVersionDetail) {
          versionDetail = await wallet.getVersionDetail(versionInfo.currentVesion);
          localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(versionDetail));

          if (versionDetail && versionDetail.notice) {
            setShowVersionNotice(versionDetail);
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    run();
  }, []);

  const [switchChainModalVisible, setSwitchChainModalVisible] = useState(false);

  if (!currentAccount.address) {
    return <LoadingPage />;
  }
  return (
    <Layout>
      <Header
        type="home"
        LeftComponent={
          <Card
            preset="style2"
            style={{ height: 28 }}
            onClick={() => {
              navigate('SwitchKeyringScreen');
            }}
            data-testid="wallet-management-entry">
            <Text
              text={
                currentKeyring.type === KeyringType.ColdWalletKeyring
                  ? `❄️  ${currentKeyring.alianName}`
                  : currentKeyring.alianName
              }
              size="xxs"
              ellipsis
              style={{ maxWidth: 100 }}
            />
          </Card>
        }
        RightComponent={
          <Row>
            <SwitchNetworkBar />
            <SidePanelExpand />
          </Row>
        }
      />

      <Content style={{ boxSizing: 'border-box', width: '100%', maxWidth: '100%', minWidth: 0 }}>
        <AccountSelect />

        <Column gap="lg2" mt="md" style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <HomeTips />

          <BalanceCard />
          <WalletActions chain={chain} />

          <AnnouncementCard />

          <WalletHistory />
        </Column>
        {showSafeNotice && (
          <NoticePopover
            onClose={() => {
              wallet.setShowSafeNotice(false);
              setShowSafeNotice(false);
            }}
          />
        )}
        {!versionInfo.skipped && (
          <UpgradePopover
            onClose={() => {
              skipVersion(versionInfo.newVersion);
            }}
          />
        )}

        {switchChainModalVisible && (
          <SwitchChainModal
            onClose={() => {
              setSwitchChainModalVisible(false);
            }}
          />
        )}

        {showVersionNotice && (
          <VersionNotice
            notice={showVersionNotice}
            onClose={() => {
              setShowVersionNotice(null);
            }}
          />
        )}
      </Content>
      <Footer px="zero" py="zero">
        <NavTabBar tab="home" />
      </Footer>
    </Layout>
  );
}
