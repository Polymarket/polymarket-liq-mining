"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBalanceMap = void 0;
var tslib_1 = require("tslib");
var ethers_1 = require("ethers");
var balance_tree_1 = tslib_1.__importDefault(require("./balance-tree"));
var isAddress = ethers_1.utils.isAddress, getAddress = ethers_1.utils.getAddress;
function parseBalanceMap(balances) {
    // if balances are in an old format, process them
    var balancesInNewFormat = Array.isArray(balances)
        ? balances
        : Object.keys(balances).map(function (account) { return ({
            address: account,
            earnings: "0x" + balances[account].toString(16),
            reasons: '',
        }); });
    var dataByAddress = balancesInNewFormat.reduce(function (memo, _a) {
        var account = _a.address, earnings = _a.earnings, reasons = _a.reasons;
        if (!isAddress(account)) {
            throw new Error("Found invalid address: " + account);
        }
        var parsed = getAddress(account);
        if (memo[parsed])
            throw new Error("Duplicate address: " + parsed);
        var parsedNum = ethers_1.BigNumber.from(earnings);
        if (parsedNum.lte(0))
            throw new Error("Invalid amount for account: " + account);
        var flags = {
            isSOCKS: reasons.includes('socks'),
            isLP: reasons.includes('lp'),
            isUser: reasons.includes('user'),
        };
        memo[parsed] = tslib_1.__assign({ amount: parsedNum }, (reasons === '' ? {} : { flags: flags }));
        return memo;
    }, {});
    var sortedAddresses = Object.keys(dataByAddress).sort();
    // construct a tree
    var tree = new balance_tree_1.default(sortedAddresses.map(function (address) { return ({ account: address, amount: dataByAddress[address].amount }); }));
    // generate claims
    var claims = sortedAddresses.reduce(function (memo, address, index) {
        var _a = dataByAddress[address], amount = _a.amount, flags = _a.flags;
        memo[address] = tslib_1.__assign({ index: index, amount: amount.toHexString(), proof: tree.getProof(index, address, amount) }, (flags ? { flags: flags } : {}));
        return memo;
    }, {});
    var tokenTotal = sortedAddresses.reduce(function (memo, key) { return memo.add(dataByAddress[key].amount); }, ethers_1.BigNumber.from(0));
    return {
        merkleRoot: tree.getHexRoot(),
        tokenTotal: tokenTotal.toHexString(),
        claims: claims,
    };
}
exports.parseBalanceMap = parseBalanceMap;
//# sourceMappingURL=parse-balance-map.js.map