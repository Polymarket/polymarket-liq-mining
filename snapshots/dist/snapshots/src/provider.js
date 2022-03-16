"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = void 0;
const providers_1 = require("@ethersproject/providers");
let provider;
function getProvider() {
    if (provider == null) {
        provider = new providers_1.JsonRpcProvider(process.env.MATIC_RPC_URL);
    }
    return provider;
}
exports.getProvider = getProvider;
