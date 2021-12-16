import { Transaction } from "./types";

import { Interface } from "@ethersproject/abi";
import MerkleDistributorAbi from "./abi/MerkleDistributor.json";

/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 */
export const freezeTx = (merkleDistributorAddress: string): Transaction => {
  return {
    to: merkleDistributorAddress,
    data: new Interface(MerkleDistributorAbi).encodeFunctionData("freeze"),
    value: "0x0",
  };
};

/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 */
export const unfreezeTx = (merkleDistributorAddress: string): Transaction => {
  return {
    to: merkleDistributorAddress,
    data: new Interface(MerkleDistributorAbi).encodeFunctionData("unfreeze"),
    value: "0x0",
  };
};

/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 * @param merkleRoot - new merkle root
 */
export const updateMerkleRootTx = (merkleDistributorAddress: string, merkleRoot: string): Transaction => {
  return {
    to: merkleDistributorAddress,
    data: new Interface(MerkleDistributorAbi).encodeFunctionData("updateMerkleRoot(bytes32)", [merkleRoot]),
    value: "0x0",
  };
};
