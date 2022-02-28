"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributorSdk = void 0;
var tslib_1 = require("tslib");
var ethers_1 = require("ethers");
var MerkleDistributor_json_1 = tslib_1.__importDefault(require("./abi/MerkleDistributor.json"));
var claims_1 = require("./claims");
var ethers_2 = require("ethers");
var admin_1 = require("./admin");
var networks_1 = require("./networks");
var erc20_1 = require("./erc20");
var _1 = require(".");
var DistributorSdk = /** @class */ (function () {
    /**
     * returns an array of what leafs have been claimed
     * @param signer - a JsonRpcSigner to sign transactions
     * @param chainID - the chain ID
     * @param token - our Token TS enum which maps to a an ERC20 address OR an ERC20 token address for testing
     * @param distributorAddress - a local address to the distributor token - only used for testing.
     */
    function DistributorSdk(signer, chainID, token, distributorAddress) {
        var _a;
        if (!signer.provider) {
            throw new Error("Signer must be connected to a provider.");
        }
        this.signer = signer;
        this.chainID = chainID;
        var network = networks_1.getContracts(chainID)[token];
        if (!distributorAddress && !network) {
            throw new Error("Distributor contract must be set!");
        }
        if (!network && token.slice(0, 2) !== "0x") {
            throw new Error("ERC20 contract must be set!");
        }
        this.token = (_a = network === null || network === void 0 ? void 0 : network.erc20) !== null && _a !== void 0 ? _a : token;
        this.distributor = new ethers_1.Contract(distributorAddress !== null && distributorAddress !== void 0 ? distributorAddress : network.distributor, MerkleDistributor_json_1.default, signer.provider);
    }
    /**
     * returns an array of what leafs have been claimed
     * @param merkleInfo - merkle distributor info. which claims to iterate over
     */
    DistributorSdk.prototype.getClaimedStatus = function (merkleInfo) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises, _a, _b, _i, address, isClaimed;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        promises = [];
                        _a = [];
                        for (_b in merkleInfo.claims)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        address = _a[_i];
                        return [4 /*yield*/, this.isClaimed(merkleInfo.claims[address].index)];
                    case 2:
                        isClaimed = _c.sent();
                        promises.push(tslib_1.__assign(tslib_1.__assign({}, merkleInfo.claims[address]), { isClaimed: isClaimed,
                            address: address }));
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, Promise.all(promises)];
                }
            });
        });
    };
    /**
     * freezes the contract
     * @notice - only admin
     */
    DistributorSdk.prototype.freeze = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tx, res;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = admin_1.freezeTx(this.distributor.address);
                        return [4 /*yield*/, this.signer.sendTransaction(tx)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    /**
     * unfreezes the contract
     * @notice - only admin
     */
    DistributorSdk.prototype.unfreeze = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tx, res;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = admin_1.unfreezeTx(this.distributor.address);
                        return [4 /*yield*/, this.signer.sendTransaction(tx)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    /**
     * updates the merkle root
     * @notice - only admin
     * @param newRoot - new merkle root
     */
    DistributorSdk.prototype.updateMerkleRoot = function (newRoot) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tx, res;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = admin_1.updateMerkleRootTx(this.distributor.address, newRoot);
                        return [4 /*yield*/, this.signer.sendTransaction(tx)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        });
    };
    /**
     * gets current week
     */
    DistributorSdk.prototype.getWeek = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tx;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.distributor.week()];
                    case 1:
                        tx = _a.sent();
                        return [2 /*return*/, tx];
                }
            });
        });
    };
    /**
     * @param claimIndex - claim index to check if an amount has been claimed
     */
    DistributorSdk.prototype.isClaimed = function (claimIndex) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tx;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.distributor.isClaimed(claimIndex)];
                    case 1:
                        tx = _a.sent();
                        return [2 /*return*/, tx];
                }
            });
        });
    };
    /**
     * @param claimIndex - claim index
     * @param account - account included in the proof + where token will be transferred to
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     */
    DistributorSdk.prototype.claim = function (claimIndex, account, amount, merkleProof) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var tx, response;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tx = claims_1.claimTx(this.distributor.address, claimIndex, account, amount, merkleProof);
                        return [4 /*yield*/, this.signer.sendTransaction(tx)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * @param claimIndex - claim index
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     * @param recipient - where token will be transferred to
     */
    DistributorSdk.prototype.claimTo = function (claimIndex, amount, merkleProof, recipient) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var domain, types, week, value, hexSig0, _a, v0, r0, s0, tx, response;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        domain = {
                            name: "PolyMarket Distributor",
                            chainId: this.chainID,
                            verifyingContract: this.distributor.address,
                        };
                        types = {
                            Claim: [
                                { name: "recipient", type: "address" },
                                { name: "amount", type: "uint256" },
                                { name: "week", type: "uint32" },
                                { name: "index", type: "uint256" },
                            ],
                        };
                        return [4 /*yield*/, this.getWeek()];
                    case 1:
                        week = _b.sent();
                        value = {
                            recipient: recipient,
                            amount: amount,
                            week: week,
                            index: claimIndex,
                        };
                        return [4 /*yield*/, this.signer._signTypedData(domain, types, value)];
                    case 2:
                        hexSig0 = _b.sent();
                        _a = ethers_2.utils.splitSignature(hexSig0), v0 = _a.v, r0 = _a.r, s0 = _a.s;
                        tx = claims_1.claimToTx(this.distributor.address, claimIndex, amount, merkleProof, recipient, v0, r0, s0);
                        return [4 /*yield*/, this.signer.sendTransaction(tx)];
                    case 3:
                        response = _b.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * @param claimIndex - claim index
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     * @param account - who can claim the token
     * @param recipient - where token will be transferred to
     */
    DistributorSdk.prototype.claimAndTransfer = function (claimIndex, amount, merkleProof, account, recipient) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var claimResponse, transferResponse;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.signer.sendTransaction(claims_1.claimTx(this.distributor.address, claimIndex, account, amount, merkleProof))];
                    case 1:
                        claimResponse = _a.sent();
                        return [4 /*yield*/, this.signer.sendTransaction(erc20_1.erc20TransferTransaction(this.token, recipient, amount))];
                    case 2:
                        transferResponse = _a.sent();
                        return [2 /*return*/, [claimResponse, transferResponse]];
                }
            });
        });
    };
    /**
     * THIS DOES NOT SIGN TX, JUST POPULATES THE TX
     * @param claimIndex - claim index
     * @param account - account included in the proof + where token will be transferred to
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     */
    DistributorSdk.prototype.populateClaimTx = function (claimIndex, account, amount, merkleProof) {
        var tx = claims_1.claimTx(this.distributor.address, claimIndex, account, amount, merkleProof);
        return tslib_1.__assign(tslib_1.__assign({}, tx), { typeCode: _1.CallType.Call });
    };
    /**
     * THIS DOES NOT SIGN TX, JUST POPULATES THE TX
     * @param claimIndex - claim index
     * @param amount - amount of tokens to be transferred
     * @param merkleProof - proof of claim
     * @param account - who can claim the token
     * @param recipient - where token will be transferred to
     */
    DistributorSdk.prototype.populateClaimAndTransferTx = function (claimIndex, amount, merkleProof, account, recipient) {
        var txA = claims_1.claimTx(this.distributor.address, claimIndex, account, amount, merkleProof);
        var txB = erc20_1.erc20TransferTransaction(this.token, recipient, amount);
        return [
            tslib_1.__assign(tslib_1.__assign({}, txA), { typeCode: _1.CallType.Call }),
            tslib_1.__assign(tslib_1.__assign({}, txB), { typeCode: _1.CallType.Call }),
        ];
    };
    return DistributorSdk;
}());
exports.DistributorSdk = DistributorSdk;
//# sourceMappingURL=distributorSdk.js.map