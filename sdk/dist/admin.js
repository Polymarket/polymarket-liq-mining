"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMerkleRootTx = exports.unfreezeTx = exports.freezeTx = void 0;
var tslib_1 = require("tslib");
var types_1 = require("./types");
var abi_1 = require("@ethersproject/abi");
var MerkleDistributor_json_1 = tslib_1.__importDefault(require("./abi/MerkleDistributor.json"));
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 */
var freezeTx = function (merkleDistributorAddress) {
    return {
        to: merkleDistributorAddress,
        typeCode: types_1.CallType.Call,
        data: new abi_1.Interface(MerkleDistributor_json_1.default).encodeFunctionData("freeze"),
        value: "0x0",
    };
};
exports.freezeTx = freezeTx;
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 */
var unfreezeTx = function (merkleDistributorAddress) {
    return {
        to: merkleDistributorAddress,
        typeCode: types_1.CallType.Call,
        data: new abi_1.Interface(MerkleDistributor_json_1.default).encodeFunctionData("unfreeze"),
        value: "0x0",
    };
};
exports.unfreezeTx = unfreezeTx;
/**
 * @param merkleDistributorAddress - merkle distributor to check claimIndex
 * @param merkleRoot - new merkle root
 */
var updateMerkleRootTx = function (merkleDistributorAddress, merkleRoot) {
    return {
        to: merkleDistributorAddress,
        typeCode: types_1.CallType.Call,
        data: new abi_1.Interface(MerkleDistributor_json_1.default).encodeFunctionData("updateMerkleRoot(bytes32)", [merkleRoot]),
        value: "0x0",
    };
};
exports.updateMerkleRootTx = updateMerkleRootTx;
//# sourceMappingURL=admin.js.map