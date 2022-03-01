import fs from "fs";
import path from "path";

// should throw if file does not exist
export const getAddressFromDeployment = (path: string): string =>
    JSON.parse(fs.readFileSync(path, "utf-8")).address

export const getDistributorAddress = (_environmentName: string, tokenSymbol: string): string => {
    const networkName = _environmentName === "localhost" ? "localhost" : "matic";

    const deploymentPath = path.resolve(__dirname, "../../merkle-distributor/deployments", networkName, `${tokenSymbol}_MerkleDistributor.json`);

    return getAddressFromDeployment(deploymentPath);
};

