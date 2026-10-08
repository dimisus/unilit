import { describe, expect, it } from 'vitest'

import { deriveContextHash, parseHexContext } from '../src/keyrings/derive-context-hash'
import { HdKeyring } from '../src/keyrings/hd-keyring'
const sampleMnemonic =
  'finish oppose decorate face calm tragic certain desk hour urge dinosaur mango'
const firstPrivateKey = 'ad7d55d3d00575303375d171c3508a04152db40f423ef1f2fbb32a6a23c64a1d'
const firstAccount = '03cd319fef0a43ff14243f332a909d0e6eed2876da63faafaa159ac230ef250cd4'
const secondAccount = '0395daa38060fd0d91d1bfeedde06138680f8ea53d19274fdd63e69c83af5a659f'
describe('bitcoin-hd-keyring', () => {
  describe('constructor', () => {
    it('constructs with a typeof string mnemonic', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })
      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq(firstAccount)
      expect(accounts[1]).eq(secondAccount)
      const privateKey = await keyring.exportAccount(accounts[0])
      expect(privateKey).eq(firstPrivateKey)
    })
  })

  describe('#clearSensitiveData', () => {
    it('zeros derived and master private-key bytes before clearing references', () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0],
      })
      const masterPrivateKey = keyring.hdWallet.privateKey
      const accountPrivateKey = keyring.wallets[0]!.privateKey!

      keyring.clearSensitiveData()

      expect([...masterPrivateKey]).toEqual(new Array(32).fill(0))
      expect([...accountPrivateKey]).toEqual(new Array(32).fill(0))
      expect(keyring.mnemonic).toBe('')
      expect(keyring.passphrase).toBe('')
      expect(keyring.hdWallet).toBeUndefined()
    })
  })

  describe('re-initialization protection', () => {
    const alreadyProvidedError = 'Btc-Hd-Keyring: Secret recovery phrase already provided'
    it('double generateRandomMnemonic', async () => {
      const keyring = new HdKeyring()
      await keyring.initFromMnemonic(sampleMnemonic)

      let error = ''
      try {
        await keyring.initFromMnemonic(sampleMnemonic)
      } catch (e) {
        error = (e as Error).message
      }
      expect(error).eq(alreadyProvidedError)
    })

    it('constructor + generateRandomMnemonic', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })

      let error = ''
      try {
        await keyring.initFromMnemonic(sampleMnemonic)
      } catch (e) {
        error = (e as Error).message
      }
      expect(error).eq(alreadyProvidedError)
    })
  })

  describe('Keyring.type', () => {
    it('is a class property that returns the type string.', () => {
      const { type } = HdKeyring
      expect(typeof type).eq('string')
    })
  })

  describe('#type', () => {
    it('returns the correct value', () => {
      const keyring = new HdKeyring()

      const { type } = keyring
      const correct = HdKeyring.type
      expect(type).eq(correct)
    })
  })

  describe('#Change hdPath', () => {
    it('pass m/44', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
        hdPath: "m/44'/0'/0'/0",
      })

      const accounts_m44 = await keyring.getAccounts()
      expect(accounts_m44).deep.equal([
        '025d7c14ab260a6932bc5484a0d9791f5cce66b0c6e1e4d7aee1e6bd294459e7d9',
        '0306cd1266c7dfc5522d1f170fa45cca29a7071a5dad848204b676cbd398aa7d30',
      ])
    })

    it('pass m/84', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
        hdPath: "m/84'/0'/0'/0",
      })

      const accounts_m84 = await keyring.getAccounts()
      expect(accounts_m84).deep.equal([
        '02d16db9d525d8623e80c04e33c4463450285791124381bc545bb85e5e8925a776',
        '023f0b3115a6c5a51ec62d8cbe6e834e79fe4bf22555e095a163e0e451a6fdc4d5',
      ])
    })

    it('change m/44 to m/84', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
        hdPath: "m/44'/0'/0'/0",
      })

      keyring.changeHdPath("m/84'/0'/0'/0")
      const accounts_m84 = await keyring.getAccounts()
      expect(accounts_m84).deep.equal([
        '02d16db9d525d8623e80c04e33c4463450285791124381bc545bb85e5e8925a776',
        '023f0b3115a6c5a51ec62d8cbe6e834e79fe4bf22555e095a163e0e451a6fdc4d5',
      ])
    })

    it('getAccountByHdPath', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
        hdPath: "m/44'/0'/0'/0",
      })

      const account = keyring.getAccountByHdPath("m/84'/0'/0'/0", 1)
      expect(account).eq('023f0b3115a6c5a51ec62d8cbe6e834e79fe4bf22555e095a163e0e451a6fdc4d5')
    })
  })

  describe('more words test', () => {
    it('12 words', async () => {
      const sampleMnemonic =
        'glue peanut huge wait vicious depend copper ribbon access boring walk point'
      const firstAccount = '03c267f10064724da2199a6ee2a10799a7d5d4d2fd72cd5cfac76d9c1114ec3388'
      const secondAccount = '027307e4a9e4305c648cce1e2db33310d80fca2d4187898d0e058bf8e0c144986c'

      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq(firstAccount)
      expect(accounts[1]).eq(secondAccount)
    })

    it('15 words', async () => {
      const sampleMnemonic =
        'gloom prepare pause lazy item valley pear develop ahead crucial fuel seed bone reward shoot'
      const firstAccount = '029f2085e85030a0cf694f42a50319d4d457dbe6222f404786db61de6ee005f06b'
      const secondAccount = '029b2c86214d241c15cbf3e58a7b76df87de97d7181876f541d18f3d5828197927'

      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq(firstAccount)
      expect(accounts[1]).eq(secondAccount)
    })

    it('18 words', async () => {
      const sampleMnemonic =
        'machine chest second galaxy rally design stumble code address general twelve job code acquire dutch debate jealous truly'
      const firstAccount = '027519cf5f210a520d6a199e6b79a90d86b6220073981dbc9a05e331f50d528360'
      const secondAccount = '03857781370d0e55f325801a316d8a9e3e7e81c02f1e74a61d0f0a28373deca5a3'

      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq(firstAccount)
      expect(accounts[1]).eq(secondAccount)
    })

    it('21 words', async () => {
      const sampleMnemonic =
        'squirrel spawn fog zero approve connect mirror social basic about alert yellow giraffe oak company file finger winner coast cushion oxygen'
      const firstAccount = '02c07ea7b03e17e72611a29e90b557a0b167e91a033ef2195ea1f3510c8382515c'
      const secondAccount = '02613ea396e40ad4e90e18b398a7f6ff7eb42f78860b6426cc36e805fb571f5c67'

      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq(firstAccount)
      expect(accounts[1]).eq(secondAccount)
    })

    it('24 words', async () => {
      const sampleMnemonic =
        'dash pair decline scrap federal marine erase lounge fancy quick valid crawl wing ahead art chaos deposit rare deputy gaze often fence alien picture'
      const firstAccount = '02e96805ec4015dd5ad86b4259339dac1e993ebf005d1508ad3678894b656a7cc6'
      const secondAccount = '02efd85d944dce50ed78db30408bbb44350433cd564a7ac9070ed902f5dc3e7d36'

      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq(firstAccount)
      expect(accounts[1]).eq(secondAccount)
    })
  })

  describe('MagicEden account-index derivation', () => {
    // MagicEden varies the BIP44 account segment instead of the address index:
    //   m/86'/0'/{i}'/0/0  and  m/84'/0'/{i}'/0/0
    // activeIndexes [0,1,2] correspond to account indices 0,1,2.

    it('P2TR (m/86): derives 3 accounts at account-index level', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1, 2],
        hdPath: "m/86'/0'/0'/0",
        accountIndexDerivation: true,
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq('02ed399b9a6d5c2bc47371bf8eafd59f2a02e81d24850013cbb2eb621bf183d748') // m/86'/0'/0'/0/0
      expect(accounts[1]).eq('0215460951216224652a468a59634428747807e402c738d8dc71349b2a4d9f94b9') // m/86'/0'/1'/0/0
      expect(accounts[2]).eq('03067fcd71e9ebe4b6f8f55671186d88c683d7421b59b3a75355379112124b1d60') // m/86'/0'/2'/0/0
    })

    it('P2WPKH (m/84): derives 3 accounts at account-index level', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1, 2],
        hdPath: "m/84'/0'/0'/0",
        accountIndexDerivation: true,
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq('02d16db9d525d8623e80c04e33c4463450285791124381bc545bb85e5e8925a776') // m/84'/0'/0'/0/0
      expect(accounts[1]).eq('020935f353d66e1e0af2972fa7332b98c1eda1b8a4399f84a59122ec292dbc5ccb') // m/84'/0'/1'/0/0
      expect(accounts[2]).eq('024ca05656e3d319971b26925f26faeb460f4345fd75868a7fe2bd780c8ea25564') // m/84'/0'/2'/0/0
    })

    it('getAccountByHdPath uses account-index derivation', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0],
        hdPath: "m/84'/0'/0'/0",
        accountIndexDerivation: true,
      })

      // account index 2 → m/84'/0'/2'/0/0
      const account = keyring.getAccountByHdPath("m/84'/0'/0'/0", 2)
      expect(account).eq('024ca05656e3d319971b26925f26faeb460f4345fd75868a7fe2bd780c8ea25564')
    })

    it('serialize and deserialize preserves accountIndexDerivation', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
        hdPath: "m/86'/0'/0'/0",
        accountIndexDerivation: true,
      })

      const serialized = await keyring.serialize()
      expect(serialized.accountIndexDerivation).toBe(true)

      const restored = new HdKeyring(serialized)
      const accounts = await restored.getAccounts()
      expect(accounts[0]).eq('02ed399b9a6d5c2bc47371bf8eafd59f2a02e81d24850013cbb2eb621bf183d748')
      expect(accounts[1]).eq('0215460951216224652a468a59634428747807e402c738d8dc71349b2a4d9f94b9')
    })

    it('standard derivation is unaffected (accountIndexDerivation defaults to false)', async () => {
      // m/84'/0'/0'/0/{i} — address index varies, same as existing behaviour
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
        hdPath: "m/84'/0'/0'/0",
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq('02d16db9d525d8623e80c04e33c4463450285791124381bc545bb85e5e8925a776') // m/84'/0'/0'/0/0
      expect(accounts[1]).eq('023f0b3115a6c5a51ec62d8cbe6e834e79fe4bf22555e095a163e0e451a6fdc4d5') // m/84'/0'/0'/0/1
    })
  })

  describe('deriveContextHash (v2.0)', () => {
    const APP_NAME = 'test-app'
    const NETWORK = 'bitcoin-mainnet'

    it('derives context hash with mnemonic-based keyring', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0],
      })
      const accounts = await keyring.getAccounts()
      const result = await keyring.deriveContextHash(accounts[0], APP_NAME, NETWORK, 'deadbeef')
      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[0-9a-f]{64}$/)
    })

    it('produces same result as direct derivation with BIP-32 derived key and pubkey injected into info', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0],
      })
      const accounts = await keyring.getAccounts()
      const contextHex = 'deadbeef'
      const keyringResult = await keyring.deriveContextHash(accounts[0], APP_NAME, NETWORK, contextHex)

      // Manually derive BIP-32 key at m/73681862' and compute directly with all 5 args.
      const bip39 = await import('bip39')
      const hdkey = await import('hdkey')
      const seedBuf = bip39.mnemonicToSeedSync(sampleMnemonic)
      const master = hdkey.fromMasterSeed(seedBuf)
      const child = master.derive("m/73681862'")
      const privKey = new Uint8Array(child.privateKey)
      const pubkeyBytes = Uint8Array.from(Buffer.from(accounts[0], 'hex'))
      const directResult = deriveContextHash(
        privKey,
        APP_NAME,
        NETWORK,
        pubkeyBytes,
        parseHexContext(contextHex),
      )
      expect(keyringResult).toBe(directResult)
    })

    it('mnemonic keyring produces DIFFERENT results across account pubkeys (v2.0 per-pubkey rotation)', async () => {
      // Under v1.0, the HD keyring ignored publicKey for derivation and returned the
      // same root for any account in the same keyring. v2.0 injects the connected
      // pubkey into HKDF info, so different accounts MUST produce different outputs
      // even though the underlying IKM (at m/73681862') is shared.
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0, 1],
      })
      const accounts = await keyring.getAccounts()
      const result0 = await keyring.deriveContextHash(accounts[0], APP_NAME, NETWORK, 'deadbeef')
      const result1 = await keyring.deriveContextHash(accounts[1], APP_NAME, NETWORK, 'deadbeef')
      expect(result0).not.toBe(result1)
    })

    it('produces DIFFERENT results across canonical networks', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0],
      })
      const accounts = await keyring.getAccounts()
      const mainnet = await keyring.deriveContextHash(accounts[0], APP_NAME, 'bitcoin-mainnet', 'deadbeef')
      const testnet = await keyring.deriveContextHash(accounts[0], APP_NAME, 'bitcoin-testnet', 'deadbeef')
      const signet = await keyring.deriveContextHash(accounts[0], APP_NAME, 'bitcoin-signet', 'deadbeef')
      expect(mainnet).not.toBe(testnet)
      expect(mainnet).not.toBe(signet)
      expect(testnet).not.toBe(signet)
    })

    it('xpriv-only keyring derives from BIP-32 path', async () => {
      const sampleXpriv =
        'xprvA2JBuYsdqVhrC2wGmb9QhBejk9gXXYgM3Jg9xgVYmDMsakDoURc8V7UYos1pP1kev1tG51PPA9A8VMYYCLov1L5c3J7npraxwjeJCquGhDi'
      const keyring = new HdKeyring({
        xpriv: sampleXpriv,
        activeIndexes: [0],
      })
      const accounts = await keyring.getAccounts()
      const result = await keyring.deriveContextHash(accounts[0], APP_NAME, NETWORK, 'deadbeef')
      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[0-9a-f]{64}$/)
    })

    it('xpriv: same account index gives same output regardless of activation order', async () => {
      // Activation-order independence: keyring1 lists [0, 1] and keyring2 lists [1, 0].
      // accounts1[0] is index 0; accounts2[1] is also index 0. Both should produce the
      // same output when the pubkey passed in matches the same underlying account.
      const sampleXpriv =
        'xprvA2JBuYsdqVhrC2wGmb9QhBejk9gXXYgM3Jg9xgVYmDMsakDoURc8V7UYos1pP1kev1tG51PPA9A8VMYYCLov1L5c3J7npraxwjeJCquGhDi'
      const keyring1 = new HdKeyring({
        xpriv: sampleXpriv,
        activeIndexes: [0, 1],
      })
      const keyring2 = new HdKeyring({
        xpriv: sampleXpriv,
        activeIndexes: [1, 0],
      })
      const accounts1 = await keyring1.getAccounts()
      const accounts2 = await keyring2.getAccounts()
      // Sanity: keyring1[0] (index 0) and keyring2[1] (also index 0) are the same pubkey.
      expect(accounts1[0]).toBe(accounts2[1])
      const result1 = await keyring1.deriveContextHash(accounts1[0], APP_NAME, NETWORK, 'deadbeef')
      const result2 = await keyring2.deriveContextHash(accounts2[1], APP_NAME, NETWORK, 'deadbeef')
      expect(result1).toBe(result2)
    })

    it('rejects invalid hex context', async () => {
      const keyring = new HdKeyring({
        mnemonic: sampleMnemonic,
        activeIndexes: [0],
      })
      const accounts = await keyring.getAccounts()
      await expect(keyring.deriveContextHash(accounts[0], APP_NAME, NETWORK, 'xyz')).rejects.toThrow()
      await expect(keyring.deriveContextHash(accounts[0], APP_NAME, NETWORK, '')).rejects.toThrow()
      await expect(keyring.deriveContextHash(accounts[0], APP_NAME, NETWORK, 'abc')).rejects.toThrow()
    })

    it('rejects uninitialized keyring', async () => {
      const keyring = new HdKeyring()
      const fakePubkey = '02' + '11'.repeat(32)
      await expect(
        keyring.deriveContextHash(fakePubkey, APP_NAME, NETWORK, 'deadbeef'),
      ).rejects.toThrow('requires a mnemonic or xpriv-based keyring')
    })

    it('pinned wallet-integration vector with canonical "abandon" mnemonic', async () => {
      const knownMnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const keyring = new HdKeyring({
        mnemonic: knownMnemonic,
        hdPath: "m/44'/0'/0'/0",
        activeIndexes: [0],
      })
      const accounts = await keyring.getAccounts()
      // accounts[0] is the m/44'/0'/0'/0/0 compressed pubkey for this mnemonic:
      // 03aaeb52dd7494c361049de67cc680e83ebcbbbdbeb13637d92cd845f70308af5e
      expect(accounts[0]).toBe(
        '03aaeb52dd7494c361049de67cc680e83ebcbbbdbeb13637d92cd845f70308af5e',
      )
      const result = await keyring.deriveContextHash(
        accounts[0],
        'test-app',
        'bitcoin-mainnet',
        'deadbeef',
      )
      expect(result).toBe('f82ced3be0e29591a7863ece03d65f79fb494fe0de7203549855f462455df008')
    })
  })

  describe('support xpriv', () => {
    it('xpriv', async () => {
      const sampleXpriv =
        'xprvA2JBuYsdqVhrC2wGmb9QhBejk9gXXYgM3Jg9xgVYmDMsakDoURc8V7UYos1pP1kev1tG51PPA9A8VMYYCLov1L5c3J7npraxwjeJCquGhDi'
      const firstAccount = '0244ffe4b9f87b7c1e2f8b0d7dee2a91492fedf9c92fc06231764826633b2c8afa'
      const secondAccount = '0243906ea96ce2680826bfd906cdfcbb70cf2764e469518ba000f0aeb76a6b025b'

      const keyring = new HdKeyring({
        xpriv: sampleXpriv,
        activeIndexes: [0, 1],
      })

      const accounts = await keyring.getAccounts()
      expect(accounts[0]).eq(firstAccount)
      expect(accounts[1]).eq(secondAccount)
    })
  })
})
