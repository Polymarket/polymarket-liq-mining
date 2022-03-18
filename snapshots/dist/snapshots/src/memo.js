"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMemoFile = exports.getMemoFile = exports.createMemoFileName = void 0;
const fs = __importStar(require("fs"));
const MEMOIZED_BASE_PATH = "./memos/";
const createMemoFileName = (epoch, tokenSymbol) => {
    return `${MEMOIZED_BASE_PATH}epoch-${epoch}-token-${tokenSymbol.toUpperCase()}.json`;
};
exports.createMemoFileName = createMemoFileName;
function getMemoFile(epoch, symbol) {
    try {
        const memoizedMarkets = fs
            .readFileSync(exports.createMemoFileName(epoch, symbol))
            .toString();
        return JSON.parse(memoizedMarkets);
    }
    catch (error) {
        console.log("get memo file error", error);
        return null;
    }
}
exports.getMemoFile = getMemoFile;
function setMemoFile(symbol, epoch, fileMap) {
    try {
        fs.writeFileSync(exports.createMemoFileName(epoch, symbol), JSON.stringify(fileMap));
    }
    catch (error) {
        console.log("write memo file error", error);
    }
}
exports.setMemoFile = setMemoFile;
