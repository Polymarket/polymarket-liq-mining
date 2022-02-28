# Polymarket liq mining SDK

This repo contains an SDK that helps interact with our Merkle Distributor contracts for claiming rewards.

### Instantiate the SDK

```typescript
const sdk = new DistributorSdk(
    yourSigner, // signer from ethers or web3, etc.
    137, // this is the chainId for Polygon
    "usdc", // can be "usdc" or "uma"
);
```

> **Note**: Contract addresses and supported chains can be found in `.src/networks`

### Distributor Info:

The information about the amounts, claim index and merkle proofs for each account is stored in `../snapshots/snapshots/`

### To Claim:

You may claim to the proxy address associated with your Polymarket account by using...

```typescript
await sdk.claim(
	claimIndex,
	address,
	amount,
	proof
)
```

You may claim and transfer from your proxy address to the recipient address of your choice using...

```typescript
await sdk.claimAndTransfer(
	claimIndex,
	amount,
	proof,
	proxyAddress,
	recipientAddress,
)
```

You may also populate these transactions and sign them yourself by calling these methods. Note, these will also return a `typeCode: "1"` property as well as `to`, `data` and `value` properties.

```typescript
const sdk = new DistributorSdk(
    yourSigner, // signer from ethers or web3, etc.
    137, // this is the chainId for Polygon
    "usdc", // can be "usdc" or "uma"
);

const claimTx = sdk.populateClaimTx(
	claimIndex,
	address,
	amount,
	proof
);

const claimAndTransferTx = sdk.populateClaimAndTransferTx(
	claimIndex,
	amount,
	proof,
	proxyAddress,
	recipientAddress,
);
```

Tests with more information about how to interact with this SDK can be found in `../merkle-distributor/test/DistributorSdk.spec.ts`
