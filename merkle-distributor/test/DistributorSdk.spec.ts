import chai, { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, BigNumber, constants, utils, Wallet } from "ethers";
// import BalanceTree from "../src/balance-tree";

import Distributor from "../artifacts/contracts/MerkleDistributor.sol/MerkleDistributor.json";
import TestERC20 from "../artifacts/contracts/test/TestERC20.sol/TestERC20.json";
import {
  parseBalanceMap,
  MerkleDistributorInfo,
} from "../src/parse-balance-map";
import { DistributorSdk } from "../../sdk/distributorSdk";
import { normalizeEarningsFewFormat } from "../../snapshots/src/helpers";
// import { getSignerFromWallet } from "./helpers";
import { NewFormat } from "../src/parse-balance-map";

const { solidity, provider, deployContract } = waffle;

chai.use(solidity);

// const overrides = { gasLimit: 9999999, };

// const ZERO_BYTES32 =
//   "0x0000000000000000000000000000000000000000000000000000000000000000";

// const ONE_BYTES32 = "0x1111111111111111111111111111111111111111111111111111111111111111";

const createMockAmounts = (wallets: Wallet[]) => {
  return wallets.reduce((acc, curr) => {
    if (!acc[curr.address]) {
      acc[curr.address] = Math.random() * 100 + 1;
    }
    return acc;
  }, {});
};

describe.only("Distributor SDK", () => {
  const wallets = provider.getWallets();
  const [deployer, alice] = wallets;

  let payouts: NewFormat[];
  let merkleInfo: MerkleDistributorInfo;
  let token: Contract;
  let merkleDistributor: Contract;
  let sdk: DistributorSdk;

  beforeEach("deploy token", async () => {
    payouts = normalizeEarningsFewFormat(createMockAmounts(wallets.slice(1)));
    merkleInfo = parseBalanceMap(payouts);

    token = await deployContract(
      deployer,
      TestERC20,
      ["Token", "TKN", 0]
      //   overrides
    );

    merkleDistributor = await deployContract(
      deployer,
      Distributor,
      [token.address, merkleInfo.merkleRoot]
      //   overrides
    );

    await token.setBalance(merkleDistributor.address, merkleInfo.tokenTotal);

    // use alice for now, can instantiate another signer in a local test
    const aliceSignerWithAddress = await ethers.getNamedSigner("alice");
    sdk = new DistributorSdk(aliceSignerWithAddress._signer, 31337);
    sdk.setContracts(aliceSignerWithAddress._signer, merkleDistributor.address);
  });

  it("should show what week it is", async () => {
    expect(await sdk.getWeek()).to.eq(0);
  });

  // claim
  it("should allow a user to claim", async () => {
    const aliceMerkleInfo = merkleInfo.claims[alice.address];
    expect(await sdk.isClaimed(aliceMerkleInfo.index)).to.eq(false);
    await sdk.claim(
      aliceMerkleInfo.index,
      alice.address,
      aliceMerkleInfo.amount,
      aliceMerkleInfo.proof
    );
    expect(await sdk.isClaimed(aliceMerkleInfo.index)).to.eq(true);
  });

  // claimTo
  it("should allow a user to claimTo", async () => {
    const bobSigner = await ethers.getNamedSigner("bob");
    const ivanSigner = await ethers.getNamedSigner("ivan");

    sdk = new DistributorSdk(bobSigner._signer, 31337);
    sdk.setContracts(bobSigner._signer, merkleDistributor.address);

    const bobMerkleInfo = merkleInfo.claims[bobSigner.address];

    expect(await sdk.isClaimed(bobMerkleInfo.index)).to.eq(false);
    expect(await token.balanceOf(ivanSigner.address)).to.eq(0);

    await sdk.claimTo(
      bobMerkleInfo.index,
      bobMerkleInfo.amount,
      bobMerkleInfo.proof,
      ivanSigner.address
    );

    expect(await sdk.isClaimed(bobMerkleInfo.index)).to.eq(true);
    expect(await token.balanceOf(ivanSigner.address)).to.eq(
      bobMerkleInfo.amount
    );
  });

  // todo - write previous script
  // reset merkle root

  // check incremented amount
});
