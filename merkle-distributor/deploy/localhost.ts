// import { BigNumber, Contract } from "ethers";
// import { MerkleDistributor, PolyERC20 } from "../typechain";
// import Erc20Abi from "../abi/ERC20.json";
// import { ethers } from "hardhat";
//
// export default async ({ getNamedAccounts, deployments }) => {
//   const { deploy } = deployments;
//   const { deployer } = await getNamedAccounts();
//
//   const epoch0MerkleRoot =
//     "0xf9c83989a69f297cce23b3eaa170ffc83bc134b9a6bb59580bcaff5dc858fac7";
//
// //   const epoch0TokenTotal = "0x152d02c7e14ae9ba1e28";
// //   const epoch0Supply = BigNumber.from(epoch0TokenTotal);
//
//   const totalTokenSupply = BigNumber.from(10).pow(18).mul(1000000000);
//
//   const { address: tokenAddress }: PolyERC20 = await deploy("PolyERC20", {
//     from: deployer,
//     args: ["PolyToken", "PMT", totalTokenSupply.toString()],
//   });
//
//   const deployerSigner = await ethers.getNamedSigner("deployer");
//
//   const erc20Contract = new Contract(tokenAddress, Erc20Abi, deployerSigner);
//   const contractSupply = await erc20Contract.totalSupply();
//
//   const { address: distributorAddress }: MerkleDistributor = await deploy(
//     "MerkleDistributor",
//     {
//       from: deployer,
//       args: [tokenAddress, epoch0MerkleRoot],
//     }
//   );
//
//   erc20Contract.transfer(
//     distributorAddress,
//     BigNumber.from(10).pow(18).mul(1000000).toString()
//     // epoch0Supply.toString() // would have to transfer more ERC20 every epoch...
//   );
//
//   const distributorBalance = await erc20Contract.balanceOf(distributorAddress);
//   console.log("deployer address", deployerSigner.address);
//   console.log("deployerBalance", BigNumber.from(distributorBalance).toString());
//   console.log("contractSupply", BigNumber.from(contractSupply).toString());
//   console.log("tokenAddress", tokenAddress);
//   console.log("distributorAddress", distributorAddress);
// };

import {BigNumber, Contract} from "ethers";
import {MerkleDistributor, PolyERC20} from "../typechain";
import Erc20Abi from "../abi/ERC20.json";
import {ethers} from "hardhat";
import {getMerkleRoot} from "../src/merkle-root-helpers";

export default async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const deployerSigner = await ethers.getNamedSigner("deployer");

    const totalTokenSupply = BigNumber.from(10).pow(18).mul(1000000000);

    const SNAPSHOT_BASE_FILE_PATH = process.env.SNAPSHOT_BASE_FILE_PATH;

    // ------------
    // USDC
    // ------------
    // const usdcMerkleRoot =
    //     "0x5eb61dcb79d44aee5d9bbee846a9ad3eb769cdfdfb264c82b2b5319ac53a6b0b";
    const usdcMerkleRoot = await getMerkleRoot(SNAPSHOT_BASE_FILE_PATH, "USDC", 0);

    const {address: usdcTokenAddress}: PolyERC20 = await deploy("USDC_ERC20", {
        from: deployer,
        args: ["USD Coin", "USDC", totalTokenSupply.toString()],
    });

    const usdcErc20Contract = new Contract(
        usdcTokenAddress,
        Erc20Abi,
        deployerSigner
    );

    const usdcContractSupply = await usdcErc20Contract.totalSupply();

    const {address: usdcDistributorAddress}: MerkleDistributor = await deploy(
        "USDC_MerkleDistributor",
        {
            from: deployer,
            args: [usdcTokenAddress, usdcMerkleRoot],
        }
    );

    usdcErc20Contract.transfer(
        usdcDistributorAddress,
        BigNumber.from(10).pow(18).mul(1000000).toString()
        // epoch0Supply.toString() // would have to transfer more ERC20 every epoch...
    );

    const usdcDistributorBalance = await usdcErc20Contract.balanceOf(
        usdcDistributorAddress
    );
    console.log("deployer address", deployerSigner.address);
    console.log(
        "deployerBalance",
        BigNumber.from(usdcDistributorBalance).toString()
    );
    console.log(
        "usdcContractSupply",
        BigNumber.from(usdcContractSupply).toString()
    );
    console.log("usdcTokenAddress", usdcTokenAddress);
    console.log("usdcDistributorAddress", usdcDistributorAddress);

    // ------------
    // UMA
    // ------------
    // const umaMerkleRoot =
    //     "0x103756653b8cacf600ed0d89b9c43ab69c241e52d7f25493f3b747010428f643";
    const umaMerkleRoot = await getMerkleRoot(SNAPSHOT_BASE_FILE_PATH, "UMA", 0);

    const {address: umaTokenAddress}: PolyERC20 = await deploy("UMA_ERC20", {
        from: deployer,
        args: ["UMA Token", "UMA", totalTokenSupply.toString()],
    });

    const umaErc20Contract = new Contract(
        umaTokenAddress,
        Erc20Abi,
        deployerSigner
    );

    const umaContractSupply = await umaErc20Contract.totalSupply();

    const {address: umaDistributorAddress}: MerkleDistributor = await deploy(
        "UMA_MerkleDistributor",
        {
            from: deployer,
            args: [umaTokenAddress, umaMerkleRoot],
        }
    );

    umaErc20Contract.transfer(
        umaDistributorAddress,
        BigNumber.from(10).pow(18).mul(1000000).toString()
        // epoch0Supply.toString() // would have to transfer more ERC20 every epoch...
    );

    const umaDistributorBalance = await umaErc20Contract.balanceOf(
        umaDistributorAddress
    );
    console.log("deployer address", deployerSigner.address);
    console.log(
        "deployerBalance",
        BigNumber.from(umaDistributorBalance).toString()
    );
    console.log(
        "umaContractSupply",
        BigNumber.from(umaContractSupply).toString()
    );
    console.log("umaTokenAddress", umaTokenAddress);
    console.log("umaDistributorAddress", umaDistributorAddress);
};
