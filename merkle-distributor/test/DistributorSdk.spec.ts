import chai, { expect } from "chai";
import { ethers, waffle } from "hardhat";
import { Contract, BigNumber, Wallet } from "ethers";

import Distributor from "../artifacts/contracts/MerkleDistributor.sol/MerkleDistributor.json";
import TestERC20 from "../artifacts/contracts/test/TestERC20.sol/TestERC20.json";
import {
  parseBalanceMap,
  MerkleDistributorInfo,
} from "../src/parse-balance-map";
import { DistributorSdk } from "../../sdk/distributorSdk";
import {
  combineMerkleInfo,
  normalizeEarningsFewFormat,
} from "../../snapshots/src/helpers";
import { MapOfCount } from "../../snapshots/src/interfaces";

const { solidity, provider, deployContract } = waffle;

chai.use(solidity);

// const overrides = { gasLimit: 9999999, };

const createMockAmounts = (wallets: Wallet[]): MapOfCount => {
  return wallets.reduce((acc, curr) => {
    if (!acc[curr.address]) {
      acc[curr.address] = Math.random() * 100 + 1;
    }
    return acc;
  }, {});
};

const createMockPayoutMap = (wallets: Wallet[], deployerAddress: string) => {
  return createMockAmounts(
    wallets.filter((w) => w.address !== deployerAddress)
  );
};

describe("Distributor SDK", () => {
  const wallets = provider.getWallets();
  const [deployer, alice] = wallets;

  let merkleInfo: MerkleDistributorInfo;
  let token: Contract;
  let merkleDistributor: Contract;
  let sdk: DistributorSdk;

  beforeEach("deploy token", async () => {
    const mockPayout = createMockPayoutMap(wallets, deployer.address);
    merkleInfo = parseBalanceMap(normalizeEarningsFewFormat(mockPayout));

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
    sdk = new DistributorSdk(
      aliceSignerWithAddress._signer,
      31337,
      merkleDistributor.address
    );
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

    sdk = new DistributorSdk(
      bobSigner._signer,
      31337,
      merkleDistributor.address
    );
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

  // multiple claims
  it("should update the merkle root with last epoch data", async () => {
    // daryl sdk
    const darylSigner = await ethers.getNamedSigner("daryl");
    const darylSdk = new DistributorSdk(
      darylSigner._signer,
      31337,
      merkleDistributor.address
    );

    // daryl claims
    const darylMerkleBefore = merkleInfo.claims[darylSigner.address];
    expect(await merkleDistributor.totalClaimed(darylSigner.address)).to.eq(0);
    expect(await darylSdk.isClaimed(darylMerkleBefore.index)).to.eq(false);
    await darylSdk.claim(
      darylMerkleBefore.index,
      darylSigner.address,
      darylMerkleBefore.amount,
      darylMerkleBefore.proof
    );
    expect(await darylSdk.isClaimed(darylMerkleBefore.index)).to.eq(true);
    expect(await merkleDistributor.totalClaimed(darylSigner.address)).to.eq(
      darylMerkleBefore.amount
    );

    // deployer instantiates sdk
    const deployerSigner = await ethers.getNamedSigner("deployer");
    const deployerSdk = new DistributorSdk(
      deployerSigner._signer,
      31337,
      merkleDistributor.address
    );

    // deployer freezes
    await deployerSdk.freeze();
    expect(await merkleDistributor.frozen()).to.eq(true);

    // deployer updates merkle root with new claims + previous unpaid claims
    const previousClaims = await sdk.getClaimedStatus(merkleInfo);
    const nextMockPayout = createMockPayoutMap(wallets, deployer.address);
    const nextMerkleInfo = combineMerkleInfo(previousClaims, nextMockPayout);
    await deployerSdk.updateMerkleRoot(nextMerkleInfo.merkleRoot);
    expect(await merkleDistributor.merkleRoot()).to.eq(
      nextMerkleInfo.merkleRoot
    );

    // deployer unfreezes
    await deployerSdk.unfreeze();
    expect(await merkleDistributor.frozen()).to.eq(false);

    // ivan claims
    const ivanSigner = await ethers.getNamedSigner("ivan");
	const ivanSdk =  new DistributorSdk(
      ivanSigner._signer,
      31337,
      merkleDistributor.address
    );
    const ivanMerkle = nextMerkleInfo.claims[ivanSigner.address];
    expect(await merkleDistributor.totalClaimed(ivanSigner.address)).to.eq(0);
    expect(await ivanSdk.isClaimed(ivanMerkle.index)).to.eq(false);
    await ivanSdk.claim(
      ivanMerkle.index,
      ivanSigner.address,
      ivanMerkle.amount,
      ivanMerkle.proof
    );
    expect(await ivanSdk.isClaimed(ivanMerkle.index)).to.eq(true);
    expect(await merkleDistributor.totalClaimed(ivanSigner.address)).to.eq(
      ivanMerkle.amount
    );

    // daryl claims again
    const darylMerkleAfter = nextMerkleInfo.claims[darylSigner.address];
    expect(await merkleDistributor.totalClaimed(darylSigner.address)).to.eq(
      darylMerkleBefore.amount
    );
    expect(await darylSdk.isClaimed(darylMerkleAfter.index)).to.eq(false);
    await darylSdk.claim(
      darylMerkleAfter.index,
      darylSigner.address,
      darylMerkleAfter.amount,
      darylMerkleAfter.proof
    );

    // daryl total claims should be both merkle amounts
    expect(await darylSdk.isClaimed(darylMerkleAfter.index)).to.eq(true);
    expect(await merkleDistributor.totalClaimed(darylSigner.address)).to.eq(
      BigNumber.from(darylMerkleBefore.amount).add(
        BigNumber.from(darylMerkleAfter.amount)
      )
    );
  });
});
