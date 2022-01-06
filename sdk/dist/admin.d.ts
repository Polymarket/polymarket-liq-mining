import { Transaction } from "./types";
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 */
export declare const freezeTx: (merkleDistributorAddress: string) => Transaction;
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 */
export declare const unfreezeTx: (merkleDistributorAddress: string) => Transaction;
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 * @param merkleRoot - new merkle root
 */
export declare const updateMerkleRootTx: (merkleDistributorAddress: string, merkleRoot: string) => Transaction;
//# sourceMappingURL=admin.d.ts.map