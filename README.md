# UniLit

UniLit is a browser wallet for Litecoin. It is a fork of [UniSat Wallet](https://github.com/unisat-wallet/extension), narrowed to the Litecoin core: hold LTC, send and receive it, and sign PSBTs.

A page gets `window.unilit`, can ask to connect, and can request a PSBT signature. Connecting is an approval in the wallet. Signing is a review of the PSBT (`signPsbt` and `signPsbts`) before anything is broadcast.

## What you can do with it

- Create and unlock a Litecoin wallet in the browser
- See a balance, then send and receive LTC
- Approve a site connection from the provider
- Review and sign PSBTs and broadcast a signed transaction

## Repository

This is a pnpm workspace. The extension is the app. Shared wallet code lives beside it.

```
apps/extension     Browser extension
packages/          Keyring, permissions, state, storage, and chain helpers
```

Packages are not published on their own. The extension is the release.

## Development

- Node.js 20.20.2
- pnpm 8.6.0

```bash
pnpm install
cd apps/extension
pnpm build:chrome:mv3:dev
```

The Chrome Web Store package is `pnpm build:chrome:mv3` from `apps/extension`. Firefox is `pnpm build:firefox`.

To typecheck the extension before a push that touches it:

```bash
bash scripts/install-hooks.sh
```

The hook runs `tsc --noEmit` in `apps/extension` when the push includes changes under `apps/extension/**`.

Source: https://github.com/dimisus/unilit
