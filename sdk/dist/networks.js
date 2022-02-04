"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContracts = exports.MUMBAI_CONTRACTS = exports.MAINNET_CONTRACTS = void 0;
var types_1 = require("./types");
exports.MAINNET_CONTRACTS = (_a = {
        distributor: ""
    },
    _a[types_1.Token.Uma] = "",
    _a[types_1.Token.Matic] = "",
    _a);
exports.MUMBAI_CONTRACTS = (_b = {
        distributor: ""
    },
    _b[types_1.Token.Uma] = "",
    _b[types_1.Token.Matic] = "",
    _b);
var getContracts = function (network) {
    switch (network) {
        case 1:
            return exports.MAINNET_CONTRACTS;
        case 80001:
            return exports.MUMBAI_CONTRACTS;
        default:
            console.log("WARNING: running on network id " + network + " with mainnet contract addresses. Ignore this warning if you are testing.");
            return exports.MAINNET_CONTRACTS;
    }
};
exports.getContracts = getContracts;
//# sourceMappingURL=networks.js.map