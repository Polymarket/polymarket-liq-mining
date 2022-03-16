"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDistributorAddress = exports.getAddressFromDeployment = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// should throw if file does not exist
const getAddressFromDeployment = (path) => JSON.parse(fs_1.default.readFileSync(path, "utf-8")).address;
exports.getAddressFromDeployment = getAddressFromDeployment;
const getDistributorAddress = (_environmentName, tokenSymbol) => {
    const networkName = _environmentName === "localhost" ? "localhost" : "matic";
    const deploymentPath = path_1.default.resolve(__dirname, "../../merkle-distributor/deployments", networkName, `${tokenSymbol}_MerkleDistributor.json`);
    return exports.getAddressFromDeployment(deploymentPath);
};
exports.getDistributorAddress = getDistributorAddress;
