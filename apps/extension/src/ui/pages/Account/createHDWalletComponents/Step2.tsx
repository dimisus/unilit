import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Column, Icon, Input, Text } from '@/ui/components';
import { AddressTypeCard2 } from '@/ui/components/AddressTypeCard';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { isWalletExistedError, markOnboardingWalletCreated } from '@/ui/pages/Account/createHDWalletComponents/onboardingBack';
import { ContextData, UpdateContextDataParams } from '@/ui/pages/Account/createHDWalletComponents/types';
import { satoshisToAmount } from '@/ui/utils';
import { isValidHdPath } from '@/ui/utils/bitcoin-utils';
import { LoadingOutlined } from '@ant-design/icons';
import { ADDRESS_TYPES, RESTORE_WALLETS, RestoreWalletType, getAccountDerivationPath } from '@unisat/wallet-shared';
import {
  useCreateAccountCallback,
  useCreatePreMnemonicAccountCallback,
  useI18n,
  useNavigation,
  useTools,
  useWallet
} from '@unisat/wallet-state';

export function Step2({
  contextData,
  updateContextData,
  clearSensitiveState
}: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
  clearSensitiveState: () => void;
}) {
  const wallet = useWallet();
  const tools = useTools();
  const { t } = useI18n();

  const restoreWallet = RESTORE_WALLETS[contextData.restoreWalletType];

  const hdPathOptions = useMemo(() => {
    return ADDRESS_TYPES.filter((v) => {
      if (v.displayIndex < 0) {
        return false;
      }
      if (!restoreWallet.addressTypes.includes(v.value)) {
        return false;
      }

      if (!contextData.isRestore && v.isLegacy) {
        return false;
      }

      if (contextData.customHdPath && v.isLegacy) {
        return false;
      }

      return true;
    })
      .sort((a, b) => a.displayIndex - b.displayIndex)
      .map((v) => {
        return {
          label: v.name,
          hdPath: v.hdPath,
          addressType: v.value,
          isLegacy: v.isLegacy
        };
      });
  }, [contextData.customHdPath, contextData.isRestore, contextData.restoreWalletType]);

  const [previewAddresses, setPreviewAddresses] = useState<string[]>(hdPathOptions.map((v) => ''));

  const [addressAssets, setAddressAssets] = useState<{
    [key: string]: { total_btc: string; satoshis: number; total_inscription: number };
  }>({});

  const [error, setError] = useState('');
  const [pathError, setPathError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const previewRequestRef = useRef(0);

  const createAccount = useCreateAccountCallback();
  const createAccountFromPreMnemonic = useCreatePreMnemonicAccountCallback();
  const nav = useNavigation();
  const isMagicEden = contextData.restoreWalletType === RestoreWalletType.MAGIC_EDEN;

  const [pathText, setPathText] = useState(contextData.customHdPath);

  const [recommendedTypeIndex, setRecommendedTypeIndex] = useState(0);

  useEffect(() => {
    const option = hdPathOptions[recommendedTypeIndex];
    if (option) {
      updateContextData({ addressType: option.addressType, addressTypeIndex: recommendedTypeIndex });
    }
  }, [hdPathOptions, recommendedTypeIndex, updateContextData]);

  const generateAddress = useCallback(async () => {
    const requestId = ++previewRequestRef.current;
    setPreviewLoading(true);
    setError('');
    setPreviewAddresses([]);
    setAddressAssets({});

    try {
      const keyrings = await Promise.all(
        hdPathOptions.map((options) =>
          contextData.isRestore
            ? wallet.createTmpKeyringWithMnemonics(
                contextData.mnemonics,
                contextData.customHdPath || options.hdPath,
                contextData.passphrase,
                options.addressType,
                1,
                isMagicEden
              )
            : wallet.createTmpKeyringWithPreMnemonic(
                contextData.customHdPath || options.hdPath,
                contextData.passphrase,
                options.addressType,
                1,
                isMagicEden
              )
        )
      );
      const addresses = keyrings.map((keyring) => keyring.accounts[0]?.address ?? '');

      if (requestId === previewRequestRef.current) {
        setPreviewAddresses(addresses);
      }
    } catch (e) {
      if (requestId === previewRequestRef.current) {
        setError((e as Error).message);
      }
    } finally {
      if (requestId === previewRequestRef.current) {
        setPreviewLoading(false);
      }
    }
  }, [contextData.customHdPath, contextData.isRestore, contextData.mnemonics, contextData.passphrase, hdPathOptions, isMagicEden, wallet]);

  useEffect(() => {
    void generateAddress();
    return () => {
      previewRequestRef.current++;
    };
  }, [generateAddress]);

  useEffect(() => {
    if (!contextData.isRestore || previewAddresses.length === 0 || previewAddresses.some((address) => !address)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchAddressesBalance = async () => {
      setLoading(true);
      try {
        const balances = await wallet.getMultiAddressAssets(previewAddresses.join(','));
        if (cancelled) {
          return;
        }

        const assets: { [key: string]: { total_btc: string; satoshis: number; total_inscription: number } } = {};
        let maxSatoshis = 0;
        let recommended = 0;
        for (let index = 0; index < previewAddresses.length; index++) {
          const address = previewAddresses[index]!;
          const balance = balances[index];
          if (!balance) {
            continue;
          }
          const satoshis = balance.totalSatoshis;
          assets[address] = {
            total_btc: satoshisToAmount(satoshis),
            satoshis,
            total_inscription: balance.inscriptionCount
          };
          if (satoshis > maxSatoshis) {
            maxSatoshis = satoshis;
            recommended = index;
          }
        }
        setAddressAssets(assets);
        if (maxSatoshis > 0) {
          setRecommendedTypeIndex(recommended);
        }
      } catch {
        if (!cancelled) {
          // Balance lookup is advisory: recovery must still work while offline.
          setAddressAssets({});
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAddressesBalance();
    return () => {
      cancelled = true;
    };
  }, [contextData.isRestore, previewAddresses, wallet]);

  const submitCustomHdPath = (text: string) => {
    setPathError('');
    setError('');
    text = text.replace(/[\u2018\u2019]/g, "'").trim();
    setPathText(text);
    if (text !== '') {
      const isValid = isValidHdPath(text);
      if (!isValid) {
        setPathError(t('invalid_derivation_path'));
        return;
      }
      updateContextData({
        customHdPath: text
      });
    } else {
      updateContextData({
        customHdPath: ''
      });
    }
  };

  const disabled = useMemo(() => {
    return (
      Boolean(error) ||
      Boolean(pathError) ||
      previewLoading ||
      loading ||
      submitting ||
      previewAddresses.length !== hdPathOptions.length ||
      previewAddresses.some((address) => !address)
    );
  }, [error, hdPathOptions.length, loading, pathError, previewAddresses, previewLoading, submitting]);

  const onNext = async () => {
    if (disabled) {
      return;
    }
    setSubmitting(true);
    try {
      const option = hdPathOptions[contextData.addressTypeIndex];
      const hdPath = contextData.customHdPath || option.hdPath;
      if (contextData.isRestore) {
        await createAccount(
          contextData.mnemonics,
          hdPath,
          contextData.passphrase,
          contextData.addressType,
          1,
          isMagicEden
        );
      } else {
        await createAccountFromPreMnemonic(
          hdPath,
          contextData.passphrase,
          contextData.addressType,
          1,
          isMagicEden
        );
      }
      markOnboardingWalletCreated();
      clearSensitiveState();
      nav.replace('MainScreen');
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (isWalletExistedError(message, t('wallet_existed'))) {
        markOnboardingWalletCreated();
        clearSensitiveState();
        nav.replace('MainScreen');
        return;
      }
      tools.toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Column>
      <Text text={t('address_type')} preset="bold" data-testid="address-type-title" />

      {hdPathOptions.map((item, index) => {
        const address = previewAddresses[index];
        const assets = addressAssets[address] || {
          total_btc: '--',
          satoshis: 0,
          total_inscription: 0
        };
        const hasVault = contextData.isRestore && assets.satoshis > 0;
        if (item.isLegacy && !hasVault) {
          return null;
        }

        const hdPath = getAccountDerivationPath(contextData.customHdPath || item.hdPath, 0, isMagicEden);
        return (
          <AddressTypeCard2
            key={index}
            label={`${item.label}`}
            items={[
              {
                address,
                satoshis: assets.satoshis,
                path: hdPath
              }
            ]}
            checked={index == contextData.addressTypeIndex}
            onClick={() => {
              updateContextData({
                addressTypeIndex: index,
                addressType: item.addressType
              });
            }}
            data-testid={`address-type-card-${index}`}
          />
        );
      })}

      {restoreWallet.customPathSupport && (
        <Column mt="lg">
          <Text text={t('custom_hdpath_optional')} preset="bold" />
          <Column>
            <Input
              placeholder={t('custom_hdpath')}
              value={pathText}
              onChange={(e) => {
                submitCustomHdPath(e.target.value);
              }}
              data-testid="custom-hdpath-input"
            />
          </Column>
          {pathError && <Text text={pathError} color="error" />}
        </Column>
      )}

      {!pathError && error && <Text text={error} color="error" />}

      {restoreWallet.phraseSupport && (
        <Column mt="lg">
          <Text text={t('phrase_optional')} preset="bold" />
          <Input
            placeholder={t('passphrase')}
            value={contextData.passphrase}
            onChange={async (e) => {
              updateContextData({
                passphrase: e.target.value
              });
            }}
            autoComplete="off"
            spellCheck={false}
            data-testid="passphrase-input"
          />
        </Column>
      )}

      <FooterButtonContainer>
        <Button
          text={t('continue')}
          preset="primary"
          onClick={onNext}
          disabled={disabled}
          data-testid="address-type-continue-button"
        />
      </FooterButtonContainer>

      {loading && (
        <Icon>
          <LoadingOutlined />
        </Icon>
      )}
    </Column>
  );
}
