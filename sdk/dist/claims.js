"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimToTx = exports.claimTx = void 0;
var tslib_1 = require("tslib");
var types_1 = require("./types");
var abi_1 = require("@ethersproject/abi");
var MerkleDistributor_json_1 = tslib_1.__importDefault(require("./abi/MerkleDistributor.json"));
var encodeClaim = function (index, account, amount, merkleProof) {
    return new abi_1.Interface(MerkleDistributor_json_1.default).encodeFunctionData("claim(uint256,address,uint256,bytes32[])", [
        abi_1.defaultAbiCoder.encode(["uint256"], [index]),
        account,
        abi_1.defaultAbiCoder.encode(["uint256"], [amount]),
        merkleProof,
    ]);
};
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 * @param claimIndex - claim index
 * @param account - account included in the proof + where token will be transferred to
 * @param amount - amount of tokens to be transferred
 * @param merkleProof - proof of claim
 */
var claimTx = function (merkleDistributorAddress, claimIndex, account, amount, merkleProof) {
    return {
        to: merkleDistributorAddress,
        typeCode: types_1.CallType.Call,
        data: encodeClaim(claimIndex, account, amount, merkleProof),
        value: "0x0",
    };
};
exports.claimTx = claimTx;
var encodeClaimTo = function (claimIndex, amount, merkleProof, recipient, v, r, s) {
    return new abi_1.Interface(MerkleDistributor_json_1.default).encodeFunctionData("claimTo(uint256,uint256,bytes32[],address,uint8,bytes32, bytes32)", [
        abi_1.defaultAbiCoder.encode(["uint256"], [claimIndex]),
        abi_1.defaultAbiCoder.encode(["uint256"], [amount]),
        merkleProof,
        recipient,
        abi_1.defaultAbiCoder.encode(["uint8"], [v]),
        r,
        s,
    ]);
};
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
var claimToTx = function (merkleDistributorAddress, claimIndex, amount, merkleProof, recipient, v0, r0, s0) {
    return {
        to: merkleDistributorAddress,
        typeCode: types_1.CallType.Call,
        data: encodeClaimTo(claimIndex, amount, merkleProof, recipient, v0, r0, s0),
        value: "0x0",
    };
};
exports.claimToTx = claimToTx;
//# sourceMappingURL=claims.js.map