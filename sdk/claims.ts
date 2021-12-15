// import { Transaction, CallType } from "./types";
// import MerkleDistributorAbi from './abi/MerkleDistributor.json'
// import { defaultAbiCoder, Interface } from "@ethersproject/abi";
// import { BigNumberish } from "@ethersproject/bignumber";

// // IS CLAIMED

// const encodeIsClaimed = (index: BigNumberish): string =>
//   new Interface(MerkleDistributorAbi).encodeFunctionData("isClaimed(uint256)", [
//     defaultAbiCoder.encode(["uint256"], [index]),
//   ]);

// /**
//  * @notice
//  * @param merkleDistributorAddress - merkle distributor to check claimIndex
//  * @param claimIndex - claim index to check
//  */
// export const isClaimed = (
//   merkleDistributorAddress: string,
//   claimIndex: BigNumberish
// ): Transaction => {
//   return {
//     to: merkleDistributorAddress,
//     typeCode: CallType.Call,
//     data: encodeIsClaimed(claimIndex),
//     value: "0",
//   };
// };

// // CLAIM

// const encodeClaim = (
//   index: BigNumberish,
//   account: string,
//   amount: BigNumberish,
//   merkleProof: string[]
// ): string =>
//   new Interface(MerkleDistributorAbi).encodeFunctionData(
//     "claim(uint256,address,uint256,bytes32[])",
//     [
//       defaultAbiCoder.encode(["uint256"], [index]),
//       account,
//       defaultAbiCoder.encode(["uint256"], [amount]),
//       merkleProof,
//     ]
//   );

// /**
//  * @notice
//  * @param merkleDistributorAddress - merkle distributor to check claimIndex
//  * @param claimIndex - claim index to check
//  */
// export const claim = (
//   merkleDistributorAddress: string,
//   claimIndex: BigNumberish,
//   account: string,
//   amount: BigNumberish,
//   merkleProof: string[]
// ): Transaction => {
//   return {
//     to: merkleDistributorAddress,
//     typeCode: CallType.Call,
//     data: encodeClaim(claimIndex, account, amount, merkleProof),
//     value: "0",
//   };
// };
