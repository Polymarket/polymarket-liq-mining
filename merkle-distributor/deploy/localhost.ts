import { BigNumber, Contract } from "ethers";
import { MerkleDistributor, PolyERC20 } from "../typechain";
import Erc20Abi from "../abi/ERC20.json";
import { ethers } from "hardhat";

export default async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const epoch0MerkleRoot =
    "0x597d0a8f04d759e4ebb9e564ff6c4b2a18ac5c1327b6f720a6038cb3a42e428d";
//   const epoch0TokenTotal = "0x264f0aee43fd9998";

  const totalTokenSupply = BigNumber.from(10).pow(18).mul(1000000000);

  const { address: tokenAddress }: PolyERC20 = await deploy("PolyERC20", {
    from: deployer,
    args: ["PolyToken", "PMT", totalTokenSupply.toString()],
  });

  const deployerSigner = await ethers.getNamedSigner("deployer");

  const erc20Contract = new Contract(tokenAddress, Erc20Abi, deployerSigner);
  const contractSupply = await erc20Contract.totalSupply();

  const { address: distributorAddress }: MerkleDistributor = await deploy(
    "MerkleDistributor",
    {
      from: deployer,
      args: [tokenAddress, epoch0MerkleRoot],
    }
  );

  erc20Contract.transfer(
    distributorAddress,
    BigNumber.from(10).pow(18).mul(1000000).toString()
  );

  const distributorBalance = await erc20Contract.balanceOf(distributorAddress);
  console.log('deployer address', deployerSigner.address)
  console.log("deployerBalance", BigNumber.from(distributorBalance).toString());
  console.log("contractSupply", BigNumber.from(contractSupply).toString());
  console.log("tokenAddress", tokenAddress);
  console.log("distributorAddress", distributorAddress);
};
