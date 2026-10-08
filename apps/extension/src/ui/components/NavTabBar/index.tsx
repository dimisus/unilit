import { colors } from '@/ui/theme/colors';
import { TabOption, useNavigation, useUnreadNotificationsCount } from '@unisat/wallet-state';

import { BaseView } from '../BaseView';
import { Column } from '../Column';
import { Grid } from '../Grid';
import { Icon, IconTypes } from '../Icon';
import { UnreadDot } from '../UnreadDot';

export function NavTabBar({ tab }: { tab: TabOption }) {
  return (
    <Grid columns={2} style={{ width: '100%', height: '67.5px', backgroundColor: colors.bg2 }}>
      <TabButton tabName="home" icon="unilit" isActive={tab === 'home'} data-testid="tab-home" />
      <TabButton tabName="settings" icon="settings" isActive={tab === 'settings'} data-testid="tab-settings" />
    </Grid>
  );
}

function TabButton({
  tabName,
  icon,
  isActive,
  'data-testid': dataTestId
}: {
  tabName: TabOption;
  icon: IconTypes;
  isActive: boolean;
  'data-testid'?: string;
}) {
  const nav = useNavigation();
  const unreadNotificationCount = useUnreadNotificationsCount();

  return (
    <Column
      justifyCenter
      itemsCenter
      onClick={() => {
        if (tabName === 'home') {
          nav.navigate('MainScreen');
        } else if (tabName === 'settings') {
          nav.navigate('SettingsTabScreen');
        }
      }}
      data-testid={dataTestId}>
      <Icon size={20} icon={icon} color={isActive ? 'white' : 'white_muted'} />
      <BaseView style={{ position: 'relative' }}>
        {tabName === 'settings' && unreadNotificationCount > 0 && <UnreadDot top={-28} right={-10} />}
      </BaseView>
    </Column>
  );
}
