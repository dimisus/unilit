import { useState } from 'react';

import { Button, Card, Column, Input, Radio, RadioGroup, Row, Text } from '@/ui/components';
import { FooterButtonContainer } from '@/ui/components/FooterButtonContainer';
import { markOnboardingWalletCreated } from '@/ui/pages/Account/createHDWalletComponents/onboardingBack';
import { ContextData, UpdateContextDataParams } from '@/ui/pages/Account/createHDWalletComponents/types';
import { useCreateWalletLogicImportWordsStep } from '@unisat/wallet-state';

import styles from './mnemonicGrid.module.less';

export function Step1_Import(params: {
  contextData: ContextData;
  updateContextData: (params: UpdateContextDataParams) => void;
}) {
  const { contextData } = params;

  const [curInputIndex, setCurInputIndex] = useState(0);

  const { wordsItems, t, onHandleEventPaste, inputWords, onClickNext, onClickWordsItem, onInputWordsChange, disabled } =
    useCreateWalletLogicImportWordsStep({
      ...params,
      onWalletPersisted: markOnboardingWalletCreated
    } as any);

  const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!disabled && 'Enter' == e.key) {
      onClickNext();
    }
  };

  return (
    <Column gap="lg">
      <Text text={t('secret_recovery_phrase')} preset="title-bold" textCenter />
      <Text text={t('import_an_existing_wallet_with_your_secret_recover')} preset="sub" textCenter />

      {wordsItems.length > 1 ? (
        <Row justifyCenter>
          <RadioGroup
            onChange={(value) => {
              onClickWordsItem(wordsItems[value]);
            }}
            value={contextData.wordsType}
          >
            {wordsItems.map((v) => (
              <Radio key={v.key} value={v.key}>
                {v.label}
              </Radio>
            ))}
          </RadioGroup>
        </Row>
      ) : null}

      <div className={styles.wrap}>
        <div className={styles.grid}>
          {inputWords.map((_, index) => {
            return (
              <Card
                key={index}
                gap="zero"
                style={{
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  justifyContent: 'flex-start',
                  padding: '4px 8px 4px 10px'
                }}
              >
                <Text text={`${index + 1}.`} style={{ width: 28, flexShrink: 0 }} textEnd color="textDim" />
                <Input
                  containerStyle={{
                    flex: 1,
                    minWidth: 0,
                    width: 'auto',
                    alignSelf: 'stretch',
                    minHeight: 32,
                    height: 32,
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: 8,
                    paddingRight: 4,
                    borderWidth: 0,
                    backgroundColor: 'transparent',
                    boxSizing: 'border-box'
                  }}
                  style={{ width: '100%', minWidth: 0 }}
                  value={_}
                  onPaste={(e) => {
                    onHandleEventPaste(e, index);
                  }}
                  onChange={(e) => {
                    onInputWordsChange(e, index);
                  }}
                  onFocus={() => {
                    setCurInputIndex(index);
                  }}
                  onBlur={() => {
                    setCurInputIndex(999);
                  }}
                  onKeyUp={(e) => handleOnKeyUp(e as React.KeyboardEvent<HTMLInputElement>)}
                  autoFocus={index == curInputIndex}
                  preset={'password'}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  placeholder=""
                  data-testid={`mnemonic-import-word-${index}`}
                />
              </Card>
            );
          })}
        </div>
      </div>

      <FooterButtonContainer>
        <Button
          disabled={disabled}
          text={t('continue')}
          preset="primary"
          onClick={() => {
            onClickNext();
          }}
          data-testid="mnemonic-import-continue-button"
        />
      </FooterButtonContainer>
    </Column>
  );
}
