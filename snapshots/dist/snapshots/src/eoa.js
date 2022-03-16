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
exports.getEoaLinkAddress = exports.fetchEoaAddress = exports.eoaCache = exports.writeToEoaCache = exports.batchUpdateEoaCache = exports.updateEoaCacheFromSnapshot = void 0;
const gql_client_1 = require("./gql_client");
const provider_1 = require("./provider");
const queries = __importStar(require("./queries"));
const ethers_1 = require("ethers");
const relayHubAbi_1 = require("./relayHubAbi");
const fs = __importStar(require("fs"));
// import { ReturnSnapshot } from "./interfaces";
// import { batch } from "promises-tho";
const RELAY_HUB_ADDRESS = "0xD216153c06E857cD7f72665E0aF1d7D82172F494";
const RElAY_HUB_INTERFACE = new ethers_1.ethers.utils.Interface(relayHubAbi_1.TxnRelayedEventAbiFragment);
const TXN_RELAY_EVENT_TOPIC_HASH = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes("TransactionRelayed(address,address,address,bytes4,uint8,uint256)"));
async function isEOA(address) {
    const provider = provider_1.getProvider();
    const codeAtAddress = await provider.getCode(address);
    return codeAtAddress === "0x";
}
async function getRelayHubReceipt(transactionHash) {
    const provider = provider_1.getProvider();
    const transactionReceipt = await provider.getTransactionReceipt(transactionHash);
    if (transactionReceipt != null &&
        transactionReceipt.to != null &&
        transactionReceipt.to == RELAY_HUB_ADDRESS) {
        return transactionReceipt;
    }
    return null;
}
async function getTransactionHashes(address) {
    // eslint-disable-next-line no-useless-catch
    let retryCount = 0;
    const { tries, startMs, pow, maxMs, jitter } = {
        tries: 3,
        startMs: 500,
        pow: 3,
        maxMs: 300000,
        jitter: 0.25,
    };
    while (retryCount < tries) {
        try {
            const transactionHashes = [];
            const { data } = await gql_client_1.queryGqlClient(queries.allTransactionsPerUserQuery, {
                user: address,
            });
            data.transactions.map((el) => transactionHashes.push(el.id));
            data.fpmmFundingAdditions.map((el) => transactionHashes.push(el.id));
            return transactionHashes;
        }
        catch (err) {
            console.log("\n", "address", address, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetTransactionHashes-Retry count exceeded", "address", address, "\n\n\n\n\n\n");
}
const eoaCacheFilename = "./proxy-wallet-to-eoa.json";
function getEoaCache() {
    let eoaCache;
    try {
        eoaCache = JSON.parse(fs.readFileSync(eoaCacheFilename).toString());
    }
    catch (error) {
        eoaCache = {};
    }
    return eoaCache;
}
const updateEoaCacheFromSnapshot = (snapshot) => {
    const newCache = snapshot.reduce((acc, curr) => {
        if (!acc[curr.proxyWallet] && curr.eoaWallet) {
            acc[curr.proxyWallet] = curr.eoaWallet;
        }
        return acc;
    }, {});
    exports.batchUpdateEoaCache(newCache);
};
exports.updateEoaCacheFromSnapshot = updateEoaCacheFromSnapshot;
const batchUpdateEoaCache = (newCache) => {
    const oldCache = getEoaCache();
    console.log(`Batch updating eoa cache of ${Object.keys(oldCache).length} eoa with ${Object.keys(newCache).length} new eoa's`);
    writeToEoaCache(Object.assign(Object.assign({}, oldCache), newCache));
};
exports.batchUpdateEoaCache = batchUpdateEoaCache;
function writeToEoaCache(newCache) {
    try {
        fs.writeFileSync(eoaCacheFilename, JSON.stringify(newCache));
    }
    catch (error) {
        console.log("writeToEoaCache error", error);
    }
}
exports.writeToEoaCache = writeToEoaCache;
exports.eoaCache = getEoaCache();
/**
 * Gets the corresponding eoa address for a proxy wallet address
 * Fetches the address from a pre-populated cache.
 * Falls back to the subgraph and RPC provider if the address is not found
 * @param address
 * @returns
 */
const fetchEoaAddress = async (address) => {
    let eoaAddress = exports.eoaCache[address];
    console.log("eoa in cache - ", eoaAddress);
    if (!eoaAddress) {
        try {
            eoaAddress = await exports.getEoaLinkAddress(address);
            if (eoaAddress) {
                console.log("Updating eoa cache in fetchEoaAddress! " + eoaAddress);
                writeToEoaCache(Object.assign(Object.assign({}, exports.eoaCache), { [address]: eoaAddress }));
            }
        }
        catch (error) {
            console.log("fetchEoaAddress error", error);
            return eoaAddress;
        }
    }
    return eoaAddress;
};
exports.fetchEoaAddress = fetchEoaAddress;
/**
 * Gets the corresponding eoa link address for a proxy wallet
 * Queries the subgraph and a Matic RPC provider for TransactionRelayed event logs, which index the eoa address
 * @param address: string
 * @returns eoaAddress: string
 */
const getEoaLinkAddress = async (address) => {
    if (await isEOA(address)) {
        return address;
    }
    const transactionHashes = await getTransactionHashes(address);
    for (const transactionHash of transactionHashes) {
        const transactionReceipt = await getRelayHubReceipt(transactionHash);
        if (transactionReceipt != null) {
            for (const log of transactionReceipt.logs) {
                //First topic is always a hash of the signature of the event
                const topicHash = log.topics[0];
                if (topicHash == TXN_RELAY_EVENT_TOPIC_HASH) {
                    const txnRelayedEvent = RElAY_HUB_INTERFACE.parseLog(log);
                    const eoaAddress = txnRelayedEvent.args.from;
                    return eoaAddress;
                }
            }
        }
    }
    return null;
};
exports.getEoaLinkAddress = getEoaLinkAddress;
