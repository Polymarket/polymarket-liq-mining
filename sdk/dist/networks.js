"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContracts = exports.LOCAL_CONTRACTS = exports.MUMBAI_CONTRACTS = exports.MAINNET_CONTRACTS = void 0;
var ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
exports.MAINNET_CONTRACTS = {
    usdc: {
        distributor: ADDRESS_ZERO,
        erc20: ADDRESS_ZERO,
    },
    uma: {
        distributor: ADDRESS_ZERO,
        erc20: ADDRESS_ZERO,
    },
    matic: {
        distributor: ADDRESS_ZERO,
        erc20: ADDRESS_ZERO,
    },
};
exports.MUMBAI_CONTRACTS = {
    usdc: {
        distributor: ADDRESS_ZERO,
        erc20: ADDRESS_ZERO,
    },
    uma: {
        distributor: ADDRESS_ZERO,
        erc20: ADDRESS_ZERO,
    },
    matic: {
        distributor: ADDRESS_ZERO,
        erc20: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    },
};
exports.LOCAL_CONTRACTS = {
    usdc: {
        distributor: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        erc20: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },
    uma: {
        distributor: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        erc20: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    },
    matic: {
        distributor: ADDRESS_ZERO,
        erc20: ADDRESS_ZERO,
    },
};
var getContracts = function (network) {
    switch (network) {
        case 1:
            return exports.MAINNET_CONTRACTS;
        case 31337:
            return exports.LOCAL_CONTRACTS;
        case 80001:
            return exports.MUMBAI_CONTRACTS;
        default:
            console.log("WARNING: running on network id " + network + " with mainnet contract addresses. Ignore this warning if you are testing.");
            return exports.MAINNET_CONTRACTS;
    }
};
exports.getContracts = getContracts;
//# sourceMappingURL=networks.js.map