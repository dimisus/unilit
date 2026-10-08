# UniLit Wallet Privacy Policy

Last updated: 8 October 2026

This policy describes how the UniLit Wallet browser extension handles information. UniLit is a non-custodial Litecoin wallet. It does not create an account for you, and it does not operate a server that stores your wallet.

By using the extension, you accept this policy and the [Terms of Use](https://github.com/dimisus/unilit/blob/main/TERMS.md). If you do not agree, do not use the extension.

This policy does not cover websites you open, sites you connect, explorers you configure yourself, or hardware wallets you use. Those services have their own policies. A site you approve receives the account you approve. It does not receive your seed phrase.

## 1. What is collected

When you use the extension, information involved in that use includes:

- **Public chain data.** The address you are viewing, and the public transaction data returned for it. This is information that is already on the Litecoin network.
- **Preferences you set in the extension.** Language, explorer choice, address labels, connected sites, and similar settings.
- **Usage that stays on the device.** Which screens you open and what you approve are handled inside the extension. UniLit does not run an analytics service and does not use Google Analytics.

The extension does not ask for, collect, or transmit:

- Your seed phrase
- Your private keys
- A UniLit account, email address, or phone number
- Biometric data. If the browser or operating system offers a local unlock, that check stays on the device.

Anyone who asks you to type a seed phrase or private key into a website is not UniLit.

## 2. Information stored on your device

The extension stores the following in the browser on this device:

- The encrypted wallet vault, including the seed phrase and private keys. These are encrypted with the password you choose. UniLit cannot read them.
- Language, address labels, connected sites, and a local cache of balances and history.
- A local identifier used only to keep the extension’s own interface consistent on this device.

That data is not sent to a UniLit server. Uninstalling the extension, or clearing the extension’s site data, removes it from the browser profile. Clearing it also removes the local vault, so keep a backup of the seed phrase before you do that.

## 3. Information sent off your device

Some features ask public services for data. Those requests do not include your seed phrase or private keys.

- **Balances and history.** The address you are viewing is sent to the explorer for that network. The default explorer is [litecoinspace.org](https://litecoinspace.org) (and `https://litecoinspace.org/testnet` on Litecoin testnet). If you set a custom explorer URL, the address is sent there instead.
- **Litecoin content.** Asset and content previews are loaded from [litescribe.io](https://litescribe.io).
- **LTC price.** The extension requests the public LTC-USD price from Coinbase (`api.coinbase.com`). If that request fails, it tries Kraken (`api.kraken.com`). These price requests do not include your address.
- **Phishing warnings.** The extension downloads a public phishing blocklist published by MetaMask (`raw.githubusercontent.com` and, if needed, `cdn.jsdelivr.net`). Those downloads do not include your address or seed.
- **Feedback.** Settings → Feedback opens [a GitHub issue page](https://github.com/dimisus/unilit/issues/new). Your address is not added to that link. What you type into GitHub is governed by GitHub’s own terms and privacy policy.

## 4. How information is used

Information is used only to:

- Run the wallet on your device: show balances, history, and prices, and let you review and sign transactions
- Apply the settings you chose
- Warn you about sites on the downloaded phishing list
- Comply with law, if a valid legal request ever applies to information that is actually held

UniLit does not use your information for advertising, and it does not sell it. There is no marketing list, because the extension does not collect an email address.

## 5. Sharing

UniLit does not sell personal information. The extension discloses information only as follows:

- **Explorer and content hosts.** The address you are viewing is sent to litecoinspace.org, or to the explorer URL you configured. Content requests go to litescribe.io.
- **Price hosts.** A price request, without your address, goes to Coinbase or Kraken.
- **Phishing-list hosts.** The blocklist download goes to the public URLs named above.
- **Sites you connect.** The account you approve is shared with that site. The seed phrase is not.
- **Law.** Information may be shared if the law requires it. In practice, the wallet vault is on your device and is not held by UniLit.

A connected site, an explorer, a price service, GitHub, and a hardware wallet are third parties. Their use of data is covered by their own policies.

## 6. International transfer

litecoinspace.org, litescribe.io, Coinbase, Kraken, GitHub, and the phishing-list hosts may process requests outside the country where you use the extension. Their locations and safeguards are described in their own policies. The encrypted vault itself is not uploaded as part of these requests.

## 7. Security and retention

The vault is encrypted on the device with the password you choose. No method of storage or transmission is perfectly secure. You are responsible for the password, the seed phrase backup, and the security of the browser profile.

UniLit does not keep a server copy of your wallet. Local data remains on the device until you remove it or uninstall the extension. Public chain data requested from an explorer is retained by that explorer under its own policy.

## 8. Your choices

- Choose a different explorer in the extension settings. The address is then sent to that host instead of litecoinspace.org.
- Decline a connection or a signature. Until you approve, a site does not receive your account.
- Remove local data by uninstalling the extension or clearing its storage. Export or back up the seed phrase first. UniLit cannot recover it.
- Ask a question or make a request about this policy by [opening an issue](https://github.com/dimisus/unilit/issues/new).

## 9. Eligibility

If you are under the age of majority where you live, use the extension only with a parent or guardian. The extension is not directed at children, and it does not knowingly collect personal information from them.

## 10. Notice to EU and UK users

In this policy, “personal information” means the same as “personal data” under the GDPR and the UK GDPR.

The extension is not intended to collect special-category data. Do not put that kind of information into an address label or a GitHub issue.

| Purpose | What is processed | Legal basis |
| --- | --- | --- |
| Show balances, history, and content | The address you are viewing, sent to the explorer and to litescribe.io | Steps you request before a contract, or the contract of providing the wallet you chose to use (Art. 6(1)(b)) |
| Show an LTC price | A price request that does not include your address | Legitimate interests (Art. 6(1)(f)) |
| Phishing warnings | Download of a public blocklist, without your address | Legitimate interests (Art. 6(1)(f)) |
| Remember settings | Data stored locally in the browser | Steps you request (Art. 6(1)(b)) |

Where a use relies on legitimate interests, it is limited to running the wallet safely. It is not used to build an advertising profile.

You may ask to access, correct, delete, or restrict personal information that is actually held, or to object to a use based on legitimate interests. The vault and settings are on your device; deleting the extension’s storage is the way to delete them. For anything else, [open an issue](https://github.com/dimisus/unilit/issues/new). You may also complain to your local data protection authority.

## 11. Changes

This policy may be updated. The date at the top will change when it is. Continued use of the extension after an update means you accept the updated policy, except where the law requires a separate consent.
