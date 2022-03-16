"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMarkets = void 0;
const queries_1 = require("./queries");
const gql_client_1 = require("./gql_client");
const utils_1 = require("./utils");
/**
 * Pull all markets from the subgraph
 * @param timestamp
 */
const getAllMarkets = async (timestamp) => {
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
            const markets = [];
            console.log(`Pulling all markets from subgraph...`);
            const search = true;
            const timestampInSeconds = (0, utils_1.normalizeTimestamp)(timestamp);
            while (search) {
                const { data } = await (0, gql_client_1.queryGqlClient)(queries_1.allMarketsQuery, {
                    lastId: lastId,
                    timestamp: `${timestampInSeconds}`,
                });
                if (data.fixedProductMarketMakers.length == 0) {
                    break;
                }
                for (const fpmm of data.fixedProductMarketMakers) {
                    markets.push(fpmm.id);
                }
                lastId =
                    data.fixedProductMarketMakers[data.fixedProductMarketMakers.length - 1].id;
            }
            console.log(`Found ${markets.length} markets!`);
            return markets;
        }
        catch (err) {
            console.log("\n", "timestamp", timestamp, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetAllMarkets-Retry count exceeded", "timestamp", timestamp, "\n\n\n\n\n\n");
};
exports.getAllMarkets = getAllMarkets;
