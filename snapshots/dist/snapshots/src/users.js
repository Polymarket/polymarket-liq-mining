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
exports.getAllUsers = void 0;
const queries = __importStar(require("./queries"));
const gql_client_1 = require("./gql_client");
const ban_list_1 = require("./ban_list");
const utils_1 = require("./utils");
/**
 * Pull all polymarket users from the subgraph
 * @param timestamp - get all users before this timestamp
 */
const getAllUsers = async (timestamp, excludedAccounts) => {
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
            const users = [];
            console.log(`Pulling all users from subgraph...`);
            const search = true;
            const timestampInSeconds = utils_1.normalizeTimestamp(timestamp);
            if (!excludedAccounts) {
                excludedAccounts = ban_list_1.EXCLUDED_ACCOUNTS;
            }
            while (search) {
                //Subgraph can only pull 1k accounts at a time,
                //queries the subgraph until all users are pulled
                const { data } = await gql_client_1.queryGqlClient(queries.getAllUsersQuery, {
                    lastId: lastId,
                    timestamp: `${timestampInSeconds}`,
                    excluded: excludedAccounts,
                });
                if (data.accounts.length === 0) {
                    break;
                }
                for (const account of data.accounts) {
                    //each account that is added must have added liquidity or traded in the past
                    if (account.transactions.length > 0 ||
                        account.fpmmPoolMemberships.length > 0) {
                        users.push(account.id);
                    }
                }
                lastId = data.accounts[data.accounts.length - 1].id;
            }
            console.log(`Found ${users.length} users!`);
            return users;
        }
        catch (err) {
            console.log("\n", "timestamp", timestamp, "excludedAccounts", excludedAccounts, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetAllUsers-Retry count exceeded", "timestamp", timestamp, "excludedAccounts", excludedAccounts, "\n\n\n\n\n\n");
};
exports.getAllUsers = getAllUsers;
