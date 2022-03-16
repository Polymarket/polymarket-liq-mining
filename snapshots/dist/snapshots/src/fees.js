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
exports.getAllFeesInEpoch = void 0;
const queries = __importStar(require("./queries"));
const gql_client_1 = require("./gql_client");
// import { EXCLUDED_ACCOUNTS } from "./ban_list";
const utils_1 = require("./utils");
/**
 * Pull all transactions from the subgraph in the last epoch
 * @param startTimestamp - get all tx after this timestamp
 * @param endTimestamp - get all tx before this timestamp
 */
const getAllFeesInEpoch = async (startTimestamp, endTimestamp) => {
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
            const search = true;
            const startTimestampInSeconds = (0, utils_1.normalizeTimestamp)(startTimestamp);
            const endTimestampInSeconds = (0, utils_1.normalizeTimestamp)(endTimestamp);
            const usersWithTransactions = [];
            while (search) {
                //Subgraph can only pull 1k accounts at a time,
                const { data } = await (0, gql_client_1.queryGqlClient)(queries.getUsersWhoPaidFeesInEpochQuery, {
                    startTimestamp: `${startTimestampInSeconds}`,
                    endTimestamp: `${endTimestampInSeconds}`,
                    lastId: lastId,
                });
                if (!data.transactions || data.transactions.length === 0) {
                    break;
                }
                for (const account of data.transactions) {
                    if (account.feeAmount &&
                        parseInt(account.feeAmount) > 0 &&
                        account.user &&
                        account.user.id) {
                        usersWithTransactions.push({
                            user: account.user.id,
                            amount: account.feeAmount,
                        });
                    }
                }
                lastId = data.transactions[data.transactions.length - 1].id;
            }
            console.log(`Found ${usersWithTransactions.length} transactions!`);
            return usersWithTransactions;
        }
        catch (err) {
            console.log("\n", "startTimestamp", startTimestamp, "endTimestamp", endTimestamp, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetAllFeesInEpoch-Retry count exceeded", "startTimestamp", startTimestamp, "endTimestamp", endTimestamp, "\n\n\n\n\n\n");
};
exports.getAllFeesInEpoch = getAllFeesInEpoch;
