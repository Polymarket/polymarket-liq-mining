import { Transaction } from "./types";
import { BigNumberish } from "@ethersproject/bignumber";
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 * @param claimIndex - claim index
 * @param account - account included in the proof + where token will be transferred to
 * @param amount - amount of tokens to be transferred
 * @param merkleProof - proof of claim
 */
export declare const claimTx: (merkleDistributorAddress: string, claimIndex: BigNumberish, account: string, amount: BigNumberish, merkleProof: string[]) => Transaction;
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 * @param claimIndex - claim index
 * @param amount - amount of tokens to transfer
 * @param merkleProof - proof of claim
 * @param recipient - account to transfer tokens to
 * @param v - v split signature
 * @param r - r split signature
 * @param S - s split signature
 */
export declare const claimToTx: (merkleDistributorAddress: string, claimIndex: BigNumberish, amount: BigNumberish, merkleProof: string[], recipient: string, v0: number, r0: string, s0: string) => Transaction;
//# sourceMappingURL=claims.d.ts.map