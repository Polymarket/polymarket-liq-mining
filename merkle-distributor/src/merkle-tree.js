"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ethereumjs_util_1 = require("ethereumjs-util");
var MerkleTree = /** @class */ (function () {
    function MerkleTree(elements) {
        this.elements = tslib_1.__spreadArray([], elements);
        // Sort elements
        this.elements.sort(Buffer.compare);
        // Deduplicate elements
        this.elements = MerkleTree.bufDedup(this.elements);
        this.bufferElementPositionIndex = this.elements.reduce(function (memo, el, index) {
            memo[ethereumjs_util_1.bufferToHex(el)] = index;
            return memo;
        }, {});
        // Create layers
        this.layers = this.getLayers(this.elements);
    }
    MerkleTree.prototype.getLayers = function (elements) {
        if (elements.length === 0) {
            throw new Error('empty tree');
        }
        var layers = [];
        layers.push(elements);
        // Get next layer until we reach the root
        while (layers[layers.length - 1].length > 1) {
            layers.push(this.getNextLayer(layers[layers.length - 1]));
        }
        return layers;
    };
    MerkleTree.prototype.getNextLayer = function (elements) {
        return elements.reduce(function (layer, el, idx, arr) {
            if (idx % 2 === 0) {
                // Hash the current element with its pair element
                layer.push(MerkleTree.combinedHash(el, arr[idx + 1]));
            }
            return layer;
        }, []);
    };
    MerkleTree.combinedHash = function (first, second) {
        if (!first) {
            return second;
        }
        if (!second) {
            return first;
        }
        return ethereumjs_util_1.keccak256(MerkleTree.sortAndConcat(first, second));
    };
    MerkleTree.prototype.getRoot = function () {
        return this.layers[this.layers.length - 1][0];
    };
    MerkleTree.prototype.getHexRoot = function () {
        return ethereumjs_util_1.bufferToHex(this.getRoot());
    };
    MerkleTree.prototype.getProof = function (el) {
        var idx = this.bufferElementPositionIndex[ethereumjs_util_1.bufferToHex(el)];
        if (typeof idx !== 'number') {
            throw new Error('Element does not exist in Merkle tree');
        }
        return this.layers.reduce(function (proof, layer) {
            var pairElement = MerkleTree.getPairElement(idx, layer);
            if (pairElement) {
                proof.push(pairElement);
            }
            idx = Math.floor(idx / 2);
            return proof;
        }, []);
    };
    MerkleTree.prototype.getHexProof = function (el) {
        var proof = this.getProof(el);
        return MerkleTree.bufArrToHexArr(proof);
    };
    MerkleTree.getPairElement = function (idx, layer) {
        var pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
        if (pairIdx < layer.length) {
            return layer[pairIdx];
        }
        else {
            return null;
        }
    };
    MerkleTree.bufDedup = function (elements) {
        return elements.filter(function (el, idx) {
            return idx === 0 || !elements[idx - 1].equals(el);
        });
    };
    MerkleTree.bufArrToHexArr = function (arr) {
        if (arr.some(function (el) { return !Buffer.isBuffer(el); })) {
            throw new Error('Array is not an array of buffers');
        }
        return arr.map(function (el) { return '0x' + el.toString('hex'); });
    };
    MerkleTree.sortAndConcat = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return Buffer.concat(tslib_1.__spreadArray([], args).sort(Buffer.compare));
    };
    return MerkleTree;
}());
exports.default = MerkleTree;
//# sourceMappingURL=merkle-tree.js.map