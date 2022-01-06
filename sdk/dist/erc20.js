"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.erc20TransferTransaction = void 0;
var tslib_1 = require("tslib");
var abi_1 = require("@ethersproject/abi");
var ERC20_json_1 = tslib_1.__importDefault(require("./abi/ERC20.json"));
var encodeTokenTransfer = function (recipientAddress, amount) {
    return new abi_1.Interface(ERC20_json_1.default).encodeFunctionData("transfer(address,uint256)", [
        recipientAddress,
        amount,
    ]);
};
/**
 * @param tokenAddress - address of the ERC20 token to be transferred
 * @param recipient - where token will be transferred to
 * @param amount - amount of tokens to be transferred
 */
var erc20TransferTransaction = function (tokenAddress, recipient, amount) { return ({
    to: tokenAddress,
    data: encodeTokenTransfer(recipient, amount),
    value: "0x0",
}); };
exports.erc20TransferTransaction = erc20TransferTransaction;
//# sourceMappingURL=erc20.js.map