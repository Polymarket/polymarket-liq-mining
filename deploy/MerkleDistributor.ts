import { MerkleDistributor } from '../typechain';

export default async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const { address }: MerkleDistributor = await deploy("MerkleDistributor", {
        from: deployer,
        args: ["0xf86e8c9993a7601f0f56f34a0c3255afa0c1f493", "0xf29518d290811849413e53aa3e3d3b63864f42356ca4a1b12287aace41a31fa3"],
    });

    console.log(address)
}