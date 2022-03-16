"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertTimestampToBlockNumber = exports.getEndBlock = exports.getStartBlock = exports.getCurrentBlockNumber = void 0;
const provider_1 = require("./provider");
const utils_1 = require("./utils");
const gql_client_1 = require("./gql_client");
const queries_1 = require("./queries");
const getCurrentBlockNumber = async () => {
    const provider = provider_1.getProvider();
    return provider.getBlockNumber();
};
exports.getCurrentBlockNumber = getCurrentBlockNumber;
const getStartBlock = async (marketAddress) => {
    let blockNumber;
    const provider = provider_1.getProvider();
    const txnHash = await getFirstAddedLiquidity(marketAddress);
    if (txnHash != null) {
        const txn = await provider.getTransaction(txnHash);
        blockNumber = txn.blockNumber;
    }
    return blockNumber;
};
exports.getStartBlock = getStartBlock;
async function getEndBlock(marketAddress) {
    let blockNumber;
    const provider = provider_1.getProvider();
    const txnHash = await getMarketResolutionTransaction(marketAddress);
    if (txnHash != null) {
        const txn = await provider.getTransaction(txnHash);
        blockNumber = txn.blockNumber;
    }
    return blockNumber;
}
exports.getEndBlock = getEndBlock;
async function getFirstAddedLiquidity(marketAddress) {
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
            const { data } = await gql_client_1.queryGqlClient(queries_1.firstLiquidityAddedQuery, {
                market: marketAddress,
            });
            const fpmmFundingAdditions = data.fpmmFundingAdditions;
            let liquidityAddTxnHash;
            if (fpmmFundingAdditions.length > 0) {
                liquidityAddTxnHash = fpmmFundingAdditions[0].id;
            }
            return liquidityAddTxnHash;
        }
        catch (err) {
            console.log("\n", "marketAddress", marketAddress, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetFirstAddedLiquidity-Retry count exceeded", "marketAddress", marketAddress, "\n\n\n\n\n\n");
}
async function getMarketResolutionTransaction(marketAddress) {
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
            const { data } = await gql_client_1.queryGqlClient(queries_1.marketResolutionTxnQuery, {
                market: marketAddress,
            });
            const resolutionConditions = data.fixedProductMarketMaker.conditions;
            let resolutionHash;
            if (resolutionConditions.length > 0) {
                resolutionHash = resolutionConditions[0].resolutionHash;
            }
            return resolutionHash;
        }
        catch (err) {
            console.log("\n", "marketAddress", marketAddress, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\ngetMarketResolutionTransaction-Retry count exceeded", "marketAddress", marketAddress, "\n\n\n\n\n\n");
}
/**
 * Get an estimation of a block number, given a timestamp
 * @param timestamp
 * @returns
 */
async function convertTimestampToBlockNumber(timestamp) {
    const timestampInSeconds = utils_1.normalizeTimestamp(timestamp);
    const nowInSeconds = utils_1.normalizeTimestamp(Date.now());
    const averageBlockTime = 2.4; //polygon avg blocktime
    const lowerLimitStamp = timestampInSeconds;
    const step = 1000;
    const provider = provider_1.getProvider();
    const currentBlockNumber = await provider.getBlockNumber();
    console.log("currentBlockNumber", currentBlockNumber);
    let block = await provider.getBlock(currentBlockNumber);
    if (!block && timestampInSeconds > nowInSeconds) {
        console.log("block does not exist because timestamp is in the future");
        return currentBlockNumber;
    }
    let requestsMade = 0;
    let blockNumber = currentBlockNumber;
    if (!block) {
        block = await provider.getBlock(blockNumber);
        requestsMade += 1;
        console.log("no block found. trying again. number of requests made so far:", requestsMade);
    }
    else {
        const timestampDiff = block.timestamp - timestampInSeconds;
        //If current block timestamp and given timestamp within 50s of each other, return
        if (timestampDiff < 50) {
            return currentBlockNumber;
        }
        while (block.timestamp > timestampInSeconds) {
            const decreaseBlocks = (block.timestamp - timestampInSeconds) / averageBlockTime;
            console.log("current block is in the future, walking down the chain:", blockNumber);
            if (decreaseBlocks < 1) {
                break;
            }
            blockNumber -= Math.floor(decreaseBlocks);
            block = await provider.getBlock(blockNumber);
            requestsMade += 1;
        }
        //If we undershoot, walk back up the chain till we reach the lowerLimitStamp
        if (block.timestamp < lowerLimitStamp) {
            while (block.timestamp < lowerLimitStamp) {
                console.log("current block is in the past, walking up the chain:", blockNumber);
                blockNumber += step; //step size
                block = await provider.getBlock(blockNumber);
                requestsMade += 1;
            }
        }
        console.log(`Number of requests made to get block number from timestamp: ${requestsMade}`);
        return blockNumber;
    }
}
exports.convertTimestampToBlockNumber = convertTimestampToBlockNumber;
