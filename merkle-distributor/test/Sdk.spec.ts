import chai, { expect } from "chai";
// import { ethers, waffle } from "hardhat";
// import { Contract, BigNumber, constants, utils } from "ethers";
// import BalanceTree from "../src/balance-tree";

// import Distributor from "../artifacts/contracts/MerkleDistributor.sol/MerkleDistributor.json";
// import TestERC20 from "../artifacts/contracts/test/TestERC20.sol/TestERC20.json";
// import { parseBalanceMap } from "../src/parse-balance-map";

const { solidity, provider, deployContract } = waffle;

chai.use(solidity);

// const overrides = {
//   gasLimit: 9999999,
// };

// const ZERO_BYTES32 =
//   "0x0000000000000000000000000000000000000000000000000000000000000000";
// const ONE_BYTES32 =
//   "0x1111111111111111111111111111111111111111111111111111111111111111";

describe("Distributor SDK", () => {
  const wallets = provider.getWallets();
//   const [wallet0, wallet1] = wallets;

  it("should show up in the test suite", async () => {
    expect(2).to.eq(2);
  });
});
