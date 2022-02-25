import {MerkleDistributor} from "../typechain";
import {ethers} from "hardhat";
import {getMerkleRoot} from "../src/merkle-root-helpers";

const UMA_TOKEN_ADDRESS_POLYGON = "0x3066818837c5e6ed6601bd5a91b0762877a6b731";
const USDC_TOKEN_ADDRESS_POLYGON = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

export default async ({getNamedAccounts, deployments}) => {
    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const deployerSigner = await ethers.getNamedSigner("deployer");
    console.log("deployer address", deployerSigner.address);

    const SNAPSHOT_BASE_FILE_PATH = process.env.SNAPSHOT_BASE_FILE_PATH;

    // ------------
    // USDC
    // ------------
    const usdcMerkleRoot = await getMerkleRoot(SNAPSHOT_BASE_FILE_PATH, "USDC", 0);

    const usdcTokenAddress = USDC_TOKEN_ADDRESS_POLYGON;

    const {address: usdcDistributorAddress}: MerkleDistributor = await deploy(
        "USDC_MerkleDistributor",
        {
            from: deployer,
            args: [usdcTokenAddress, usdcMerkleRoot],
        }
    );
    console.log("usdcDistributorAddress", usdcDistributorAddress);

    // ------------
    // UMA
    // ------------
    const umaMerkleRoot = await getMerkleRoot(SNAPSHOT_BASE_FILE_PATH, "UMA", 0);

    const umaTokenAddress = UMA_TOKEN_ADDRESS_POLYGON;

    const {address: umaDistributorAddress}: MerkleDistributor = await deploy(
        "UMA_MerkleDistributor",
        {
            from: deployer,
            args: [umaTokenAddress, umaMerkleRoot],
        }
    );
    console.log("umaDistributorAddress", umaDistributorAddress);
};

