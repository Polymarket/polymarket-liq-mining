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
exports.getFees = exports.getTradeVolume = void 0;
const promises_tho_1 = require("promises-tho");
const gql_client_1 = require("./gql_client");
const queries = __importStar(require("./queries"));
const SCALE_FACTOR = Math.pow(10, 6);
/**
 * Calculates total trade volume for an address, given a timestamp snapshot
 *
 * @param addresses
 * @param timestamp
 * @returns
 */
const getTradeVolumePerUser = async (address, timestamp) => {
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
            let lastId = "";
            let tradeVolume = 0;
            const search = true;
            while (search) {
                const { data } = await gql_client_1.queryGqlClient(queries.getTradeVolumePerUserQuery, {
                    lastId: lastId,
                    user: address,
                    timestamp: `${timestamp}`,
                });
                if (data.transactions.length == 0) {
                    break;
                }
                for (const txn of data.transactions) {
                    tradeVolume += parseInt(txn.tradeAmount);
                }
                lastId = data.transactions[data.transactions.length - 1].id;
            }
            return tradeVolume / SCALE_FACTOR;
        }
        catch (err) {
            console.log("\n", "address", address, "timestamp", timestamp, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetTradeVolumePerUser-Retry count exceeded", "address", address, "timestamp", timestamp, "\n\n\n\n\n\n");
};
const getFeesPerUser = async (address, startTimestamp, endTimestamp) => {
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
            let lastId = "";
            let fees = 0;
            const search = true;
            while (search) {
                const { data } = await gql_client_1.queryGqlClient(queries.getFeesPaidPerUserQuery, {
                    lastId: lastId,
                    user: address,
                    startTimestamp: `${startTimestamp}`,
                    endTimestamp: `${endTimestamp}`,
                });
                if (data.transactions.length == 0) {
                    break;
                }
                for (const txn of data.transactions) {
                    fees += parseInt(txn.feeAmount);
                }
                lastId = data.transactions[data.transactions.length - 1].id;
            }
            return fees / SCALE_FACTOR;
        }
        catch (err) {
            console.log("\n", "address", address, "startTimestamp", startTimestamp, "endTimestamp", endTimestamp, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetFeesPerUser-Retry count exceeded", "address", address, "startTimestamp", startTimestamp, "endTimestamp", endTimestamp, "\n\n\n\n\n\n");
};
const getTradeVolumePerUserWrapper = async (arg) => {
    return await getTradeVolumePerUser(arg.address, arg.timestamp);
};
const getFeesPerUserWrapper = async (arg) => {
    return await getFeesPerUser(arg.address, arg.startTimestamp, arg.endTimestamp);
};
const getTradeVolumeBatched = promises_tho_1.batch({ batchSize: 100 }, getTradeVolumePerUserWrapper);
const getFeesBatched = promises_tho_1.batch({ batchSize: 100 }, getFeesPerUserWrapper);
/**
 * Calculates total trade volume for a list of addresses, given a timestamp snapshot
 *
 * @param addresses
 * @param timestamp
 * @returns
 */
const getTradeVolume = async (addresses, timestamp) => {
    const args = [];
    for (const address of addresses) {
        args.push({ address: address, timestamp: timestamp });
    }
    const tradeVolume = await getTradeVolumeBatched(args);
    return tradeVolume;
};
exports.getTradeVolume = getTradeVolume;
/**
 * Calculates total fees paid by a list of addresses, given a timestamp snapshot
 *
 * @param addresses
 * @param timestamp
 * @returns
 */
const getFees = async (addresses, startTimestamp, endTimestamp) => {
    const args = [];
    for (const address of addresses) {
        args.push({
            address: address,
            startTimestamp: startTimestamp,
            endTimestamp: endTimestamp,
        });
    }
    const fees = await getFeesBatched(args);
    return fees;
};
exports.getFees = getFees;
