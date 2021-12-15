import chai, { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, BigNumber, constants, utils, Wallet } from "ethers";
import BalanceTree from "../src/balance-tree";

import Distributor from "../artifacts/contracts/MerkleDistributor.sol/MerkleDistributor.json";
import TestERC20 from "../artifacts/contracts/test/TestERC20.sol/TestERC20.json";
import {
  parseBalanceMap,
  MerkleDistributorInfo,
} from "../src/parse-balance-map";
import { DistributorSdk } from "../../sdk/distributorSdk";
import {
  normalizeMapAmounts,
  normalizeMapAmountsNewFormat,
} from "../../snapshots/src/helpers";
// import { getSignerFromWallet } from "./helpers";
import { NewFormat } from "../src/parse-balance-map";

const { solidity, provider, deployContract } = waffle;

chai.use(solidity);

// const overrides = { gasLimit: 9999999, };

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

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

  // before
  beforeEach("deploy token", async () => {
    // await ethers.getSigners()
    // SignerWithAddress
    const aliceSignerWithAddress = await ethers.getNamedSigner("alice");
    const mockMap = createMockAmounts(wallets.slice(1));
    payouts = normalizeMapAmountsNewFormat(mockMap);
    merkleInfo = parseBalanceMap(payouts);

    token = await deployContract(
      // aliceSignerWithAddress,
      wallets[0],
      TestERC20,
      ["Token", "TKN", 0]
      //   overrides
    );

    merkleDistributor = await deployContract(
      // aliceSignerWithAddress,
      wallets[0],
      Distributor,
      [token.address, merkleInfo.merkleRoot]
      //   overrides
    );

    await token.setBalance(
      merkleDistributor.address,
      BigNumber.from(merkleInfo.tokenTotal)
    );

    console.log("merkleDistributor.address", merkleDistributor.address);

    sdk = new DistributorSdk(aliceSignerWithAddress._signer, 31337);
    sdk.setContracts(aliceSignerWithAddress._signer, merkleDistributor.address);
  });

  it("should show what week it is", async () => {
    expect(await sdk.getWeek()).to.eq(0);
  });

  it("should allow a user to claim", async () => {
    const aliceMerkleInfo = merkleInfo.claims[alice.address];
    expect(await sdk.isClaimed(aliceMerkleInfo.index)).to.eq(false);
    const tx = await sdk.claim(
      aliceMerkleInfo.index,
      alice.address,
      aliceMerkleInfo.amount,
      aliceMerkleInfo.proof
    );
    console.log("tx", tx);
    expect(await sdk.isClaimed(aliceMerkleInfo.index)).to.eq(true);
  });
});
