# UniLit Wallet

UniLit Wallet - a browser extension wallet for Litecoin.

- Website: https://github.com/dimisus/unilit
- Issues: https://github.com/dimisus/unilit/issues

## How to build

- Install [Node.js](https://nodejs.org) version 16
- Install dependencies: `pnpm`
- Build the project to the `./dist/` folder with `pnpm build:firefox` for Firefox
- Chrome Web Store zip: `pnpm build:chrome:mv3` (writes `dist/unilit-chrome-mv3-v*.zip`)
- Develop: `pnpm build:chrome:dev`

## Special Thanks

Thanks to the MetaMask team for their contributions to the browser extension wallet community, UniLit Wallet relies heavily on their contributions.
