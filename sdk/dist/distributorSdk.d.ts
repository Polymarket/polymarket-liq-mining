import { JsonRpcSigner } from "@ethersproject/providers";
import { ethers, Contract, BigNumberish } from "ethers";
import { IsClaimed, Token, MerkleDistributorInfo } from "./types";
import { Transaction } from "./types";
export declare class DistributorSdk {
    readonly chainID: number;
    readonly signer: JsonRpcSigner;
    readonly token: Token | string;
    distributor: Contract;
    /**
     * returns an array of what leafs have been claimed
     * @param signer - a JsonRpcSigner to sign transactions
     * @param chainID - the chain ID
     * @param token - our Token TS enum which maps to a an ERC20 address OR an ERC20 token address for testing
     * @param distributorAddress - a local address to the distributor token - only used for testing.
     */
    constructor(signer: JsonRpcSigner, chainID: number, token: Token | string, distributorAddress?: string);
    /**
     * returns an array of what leafs have been claimed
     * @param merkleInfo - merkle distributor info. which claims to iterate over
     */
    getClaimedStatus(merkleInfo: MerkleDistributorInfo): Promise<IsClaimed[]>;
    /**
     * freezes the contract
     * @notice - only admin
     */
    freeze(): Promise<ethers.providers.TransactionResponse>;
    /**
     * unfreezes the contract
     * @notice - only admin
     */
    unfreeze(): Promise<ethers.providers.TransactionResponse>;
    /**
     * updates the merkle root
     * @notice - only admin
     * @param newRoot - new merkle root
     */
    updateMerkleRoot(newRoot: string): Promise<ethers.providers.TransactionResponse>;
    /**
     * gets current week
     */
    getWeek(): Promise<number>;
    /**
     * @param claimIndex - claim index to check if an amount has been claimed
     */
    isClaimed(claimIndex: BigNumberish): Promise<boolean>;
    /**
     * @param claimIndex - claim index
     * @param account - account included in the proof + where token will be transferred to
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     */
    claim(claimIndex: BigNumberish, account: string, amount: BigNumberish, merkleProof: string[]): Promise<ethers.providers.TransactionResponse>;
    /**
     * @param claimIndex - claim index
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     * @param recipient - where token will be transferred to
     */
    claimTo(claimIndex: BigNumberish, amount: BigNumberish, merkleProof: string[], recipient: string): Promise<ethers.providers.TransactionResponse>;
    /**
     * @param claimIndex - claim index
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     * @param account - who can claim the token
     * @param recipient - where token will be transferred to
     */
    claimAndTransfer(claimIndex: BigNumberish, amount: BigNumberish, merkleProof: string[], account: string, recipient: string): Promise<[
        ethers.providers.TransactionResponse,
        ethers.providers.TransactionResponse
    ]>;
    /**
     * THIS DOES NOT SIGN TX, JUST POPULATES THE TX
     * @param claimIndex - claim index
     * @param account - account included in the proof + where token will be transferred to
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     */
    populateClaimTx(claimIndex: BigNumberish, account: string, amount: BigNumberish, merkleProof: string[]): Transaction;
    /**
     * THIS DOES NOT SIGN TX, JUST POPULATES THE TX
     * @param claimIndex - claim index
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     * @param account - who can claim the token
     * @param recipient - where token will be transferred to
     */
    populateClaimAndTransferTx(claimIndex: BigNumberish, amount: BigNumberish, merkleProof: string[], account: string, recipient: string): [Transaction, Transaction];
}
//# sourceMappingURL=distributorSdk.d.ts.map