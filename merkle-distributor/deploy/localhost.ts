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
