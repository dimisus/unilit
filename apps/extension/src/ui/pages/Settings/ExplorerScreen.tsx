import { useEffect, useState } from 'react';

import { Button, Column, Content, Header, Input, Layout, Text } from '@/ui/components';
import { useI18n, useSetExplorerBaseUrlCallback, useTools, useWallet } from '@unisat/wallet-state';

export default function ExplorerScreen() {
  const { t } = useI18n();
  const wallet = useWallet();
  const tools = useTools();
  const setExplorerBaseUrl = useSetExplorerBaseUrlCallback();
  const [value, setValue] = useState('');
  const [defaultUrl, setDefaultUrl] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    wallet.getExplorerBaseUrl().then((data) => {
      if (!active) return;
      setValue(data.url);
      setDefaultUrl(data.defaultUrl);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [wallet]);

  const save = async () => {
    try {
      await setExplorerBaseUrl(value);
      tools.toastSuccess(t('explorer_api_saved'));
      window.history.go(-1);
    } catch (error) {
      tools.toastError(t('invalid_explorer_url'));
    }
  };

  const reset = async () => {
    try {
      await setExplorerBaseUrl('');
      const data = await wallet.getExplorerBaseUrl();
      setValue(data.url);
      setDefaultUrl(data.defaultUrl);
      tools.toastSuccess(t('explorer_api_saved'));
    } catch (error) {
      tools.toastError(t('invalid_explorer_url'));
    }
  };

  return (
    <Layout>
      <Header
        onBack={() => {
          window.history.go(-1);
        }}
        title={t('explorer_api')}
      />
      <Content>
        <Column gap="lg">
          <Text text={t('explorer_api_desc')} preset="sub" />
          <Input
            preset="text"
            value={value}
            placeholder={defaultUrl}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
          {defaultUrl ? <Text text={`${t('explorer_default')}: ${defaultUrl}`} preset="sub" size="xs" /> : null}
          <Button disabled={!ready} text={t('save')} preset="primary" onClick={save} />
          <Button disabled={!ready} text={t('reset_to_default')} onClick={reset} />
        </Column>
      </Content>
    </Layout>
  );
}
