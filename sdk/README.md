# Polymarket liq mining SDK

This repo contains an SDK that helps interact with our Merkle Distributor contracts for claiming rewards.

### Instantiate the SDK

```
const sdk = new DistributorSdk(
    your-signer
    chainID (137 is Polygon),
    "usdc" or "uma"
);
```

note: Contract addresses and supported chains can be found in `.src/networks`

### Distributor Info:

The information about the claim index and merkle proofs for each account is stored in `../snapshots/snapshots/`

### To Claim:

You may claim to the proxy address associated with your Polymarket account by using...

```
await sdk.claim(
	claimIndex,
	address,
	amount,
	proof
)
```

You may claim and transfer from your proxy address to the recipient address of your choice using...

```
await sdk.claimAndTransfer(
	claimIndex,
	amount,
	proof,
	proxyAddress,
	recipientAddress,
)
```

You may also populate these transactions and sign them yourself by calling

```
sdk.populateClaimTx(
	claimIndex,
	address,
	amount,
	proof
);

sdk.populateClaimAndTransferTx(
	claimIndex,
	amount,
	proof,
	proxyAddress,
	recipientAddress,
);
```

Tests with more information about how to interact with this SDK can be found in `../merkle-distributor/test/DistributorSdk.spec.ts`
