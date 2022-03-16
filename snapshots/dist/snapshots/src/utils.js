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
exports.writeSnapshot = exports.normalizeTimestamp = void 0;
const fs = __importStar(require("fs"));
function normalizeTimestamp(timestamp) {
    return Math.floor(timestamp / 1000);
}
exports.normalizeTimestamp = normalizeTimestamp;
async function writeSnapshot(fileName, snapshotFilePath, snapshot) {
    if (snapshot.length > 0) {
        const pathComponents = snapshotFilePath.split("/");
        const dirPath = pathComponents.slice(0, pathComponents.length - 1).join("/");
        !fs.existsSync(dirPath) && fs.mkdirSync(dirPath);
        console.log(`Writing snapshot to disk...`);
        fs.writeFileSync(fileName, JSON.stringify(snapshot));
        console.log(`Complete!`);
    }
}
exports.writeSnapshot = writeSnapshot;
