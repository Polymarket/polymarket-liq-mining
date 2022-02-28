import {CallType, Transaction} from "./types";

import {defaultAbiCoder, Interface} from "@ethersproject/abi";
import {BigNumberish} from "@ethersproject/bignumber";
import MerkleDistributorAbi from "./abi/MerkleDistributor.json";

const encodeClaim = (
    index: BigNumberish,
    account: string,
    amount: BigNumberish,
    merkleProof: string[]
): string =>
    new Interface(MerkleDistributorAbi).encodeFunctionData(
        "claim(uint256,address,uint256,bytes32[])",
        [
            defaultAbiCoder.encode(["uint256"], [index]),
            account,
            defaultAbiCoder.encode(["uint256"], [amount]),
            merkleProof,
        ]
    );

/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 * @param claimIndex - claim index
 * @param account - account included in the proof + where token will be transferred to
 * @param amount - amount of tokens to be transferred
 * @param merkleProof - proof of claim
 */
export const claimTx = (
    merkleDistributorAddress: string,
    claimIndex: BigNumberish,
    account: string,
    amount: BigNumberish,
    merkleProof: string[]
): Transaction => {
    return {
        to: merkleDistributorAddress,
        data: encodeClaim(claimIndex, account, amount, merkleProof),
        value: "0x0",
    };
};

const encodeClaimTo = (
    claimIndex: BigNumberish,
    amount: BigNumberish,
    merkleProof: string[],
    recipient: string,
    v: number,
    r: string,
    s: string
): string =>
    new Interface(MerkleDistributorAbi).encodeFunctionData(
        "claimTo(uint256,uint256,bytes32[],address,uint8,bytes32, bytes32)",
        [
            defaultAbiCoder.encode(["uint256"], [claimIndex]),
            defaultAbiCoder.encode(["uint256"], [amount]),
            merkleProof,
            recipient,
            defaultAbiCoder.encode(["uint8"], [v]),
            r,
            s,
        ]
    );

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
export const claimToTx = (
    merkleDistributorAddress: string,
    claimIndex: BigNumberish,
    amount: BigNumberish,
    merkleProof: string[],
    recipient: string,
    v0: number,
    r0: string,
    s0: string
): Transaction => {
    return {
        to: merkleDistributorAddress,
        data: encodeClaimTo(claimIndex, amount, merkleProof, recipient, v0, r0, s0),
        value: "0x0",
    };
};
