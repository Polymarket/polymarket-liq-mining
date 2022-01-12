import { BigNumber, Contract } from "ethers";
import { MerkleDistributor, PolyERC20 } from "../typechain";
import Erc20Abi from "../abi/ERC20.json";
import { ethers } from "hardhat";

export default async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const epoch0MerkleRoot =
    "0xf9c83989a69f297cce23b3eaa170ffc83bc134b9a6bb59580bcaff5dc858fac7";

//   const epoch0TokenTotal = "0x152d02c7e14ae9ba1e28";
//   const epoch0Supply = BigNumber.from(epoch0TokenTotal);

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
    // epoch0Supply.toString() // would have to transfer more ERC20 every epoch...
  );

  const distributorBalance = await erc20Contract.balanceOf(distributorAddress);
  console.log("deployer address", deployerSigner.address);
  console.log("deployerBalance", BigNumber.from(distributorBalance).toString());
  console.log("contractSupply", BigNumber.from(contractSupply).toString());
  console.log("tokenAddress", tokenAddress);
  console.log("distributorAddress", distributorAddress);
};
