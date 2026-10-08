# Manage Networks

UniLit Wallet currently supports the following network types, which can be obtained through unilit.getChain, and switched through the `unilit.switchChain` method.

| name                    | enum                    | uni  | network |
| ----------------------- | ----------------------- | ---- | ------- |
| Bitcoin Mainnet         | BITCOIN_MAINNET         | BTC  | livenet |
| Bitcoin Testnet         | BITCOIN_TESTNET         | tBTC | testnet |
| Bitcoin Testnet4        | BITCOIN_TESTNET4        | tBTC | testnet |
| Bitcoin Signet          | BITCOIN_SIGNET          | sBTC | testnet |
| Fractal Bitcoin Mainnet | FRACTAL_BITCOIN_MAINNET | FB   | livenet |
| Fractal Bitcoin Testnet | FRACTAL_BITCOIN_TESTNET | tFB  | livenet |

Please note that the term "network" refers to the Bitcoin address format. For example, in the case of Fractal Bitcoin Testnet, the returned network is livenet.

## Method

### getChain

```
unilit.getChain()
```

get chain

**Parameters**

none

**Returns**

- `Promise` - `Object`:
  - `enum` - `string` : the enum of chain
  - `name` - `string` : the name of chain
  - `network` - `string` : livenet or testnet

**Example**

```javascript
try {
  let res = await window.unilit.getChain();
  console.log(res)
} catch (e) {
  console.log(e);
}

>  {enum: 'BITCOIN_MAINNET', name: 'Bitcoin Mainnet', network: 'livenet'}
```

---

### switchChain

```
unilit.switchChain(chain)
```

switch chain

**Parameters**

- `chain` - `string`: the chain enum. One of: `BITCOIN_MAINNET`, `BITCOIN_TESTNET`, `BITCOIN_TESTNET4`, `BITCOIN_SIGNET`, `FRACTAL_BITCOIN_MAINNET`, `FRACTAL_BITCOIN_TESTNET`

**Returns**

- `Promise` - `Object`:
  - `enum` - `string` : the enum of chain
  - `name` - `string` : the name of chain
  - `network` - `string` : livenet or testnet

**Example**

```javascript
try {
    let res = await window.unilit.switchChain("BITCOIN_MAINNET");
    console.log(res)
} catch (e) {
    console.log(e);
}

> {enum: 'BITCOIN_MAINNET', name: 'Bitcoin Mainnet', network: 'livenet'}
```

---

### getNetwork (deprecated)

```
unilit.getNetwork()
```

get network

> Please note that this method only supports bitcoin mainnet and bitcoin testnet. Due to the support for more networks, please switch to the getChain method.

**Parameters**

none

**Returns**

- `Promise` - `string`: the network. livenet and testnet

**Example**

```javascript
try {
  let res = await window.unilit.getNetwork();
  console.log(res)
} catch (e) {
  console.log(e);
}


"livenet"
```

### chainChanged

```javascript
unilit.on('chainChanged', handler: (network: string) => void);

unilit.removeListener('chainChanged', handler: (network: string) => void);
```

The `chainChanged` will be emitted whenever the user's network changes.

### switchNetwork (deprecated)

```
unilit.switchNetwork(network)
```

> Deprecated. Use `switchChain` instead.

**Parameters**

- `network` - `string`: `"livenet"` | `"testnet"`

---

### networkChanged (deprecated)

```javascript
unilit.on('networkChanged', handler: (network: string) => void);

unilit.removeListener('networkChanged', handler: (network: string) => void);
```

The `networkChanged` will be emitted whenever the user's network changes.
