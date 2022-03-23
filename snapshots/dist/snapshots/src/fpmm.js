"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateValOfLpPositionsAcrossBlocks = exports.getFpmm = exports.calculateValOfLpPositions = exports.calcLpPositions = void 0;
const promises_tho_1 = require("promises-tho");
const queries_1 = require("./queries");
const gql_client_1 = require("./gql_client");
/**
 * Calculates LP positions, given a fixed product market maker
 * @param fpmm
 * @returns
 */
async function calcLpPositions(fpmm) {
    const outcomeTokenPrices = fpmm.outcomeTokenPrices;
    const outcomeTokenAmounts = fpmm.outcomeTokenAmounts;
    const scaledLiquidityParameter = fpmm.scaledLiquidityParameter;
    const totalSupply = fpmm.totalSupply;
    const lpLiquidityAtBlock = {};
    if (scaledLiquidityParameter > 0) {
        for (const liquidityProvider of fpmm.poolMembers) {
            const lpAddress = liquidityProvider.funder.id;
            const lpRatio = liquidityProvider.amount / totalSupply;
            const totalPoolValUsd = (outcomeTokenAmounts[0] * outcomeTokenPrices[0] +
                outcomeTokenAmounts[1] * outcomeTokenPrices[1]) /
                Math.pow(10, 6);
            const lpPoolValUsd = lpRatio * totalPoolValUsd;
            lpLiquidityAtBlock[lpAddress] = lpPoolValUsd;
        }
    }
    return lpLiquidityAtBlock;
}
exports.calcLpPositions = calcLpPositions;
/**
 * Calculate liquidity for each LP at a market, at a block
 * @param marketAddress
 * @param block
 * @returns
 */
const calculateValOfLpPositions = async (marketAddress, block) => {
    const fpmm = await exports.getFpmm(marketAddress, block);
    if (!fpmm) {
        console.log("\n\n\n\n\n\n", "NO FPMM!", "\n", "market maker: ", marketAddress, "\n", "at block: ", block, "\n\n\n\n\n\n");
        console.log("NO FPMM!", marketAddress, "block: ", block);
    }
    if (fpmm) {
        return await calcLpPositions(fpmm);
    }
};
exports.calculateValOfLpPositions = calculateValOfLpPositions;
/**
 * Given a market and a block, fetch FPMM details as they existed at that block
 * @param marketAddress
 * @param block
 */
const getFpmm = async (marketAddress, block) => {
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
            const { data } = await gql_client_1.queryGqlClient(queries_1.getFixedProductMarketMakerQuery, {
                market: marketAddress,
                block: block,
            });
            return data.fixedProductMarketMaker;
        }
        catch (err) {
            console.log("\n", "marketAddress", marketAddress, "block", block, "retryCount", retryCount, "\n");
            retryCount += 1;
            const delay = Math.min(maxMs, startMs * retryCount ** pow);
            await new Promise((res) => setTimeout(res, delay - Math.random() * delay * jitter));
        }
    }
    console.log("\n\n\n\n\n\nRetry count exceeded", "marketAddress", marketAddress, "block", block, "\n\n\n\n\n\n");
};
exports.getFpmm = getFpmm;
const calculateValOfLpPositionsWrapper = async (args) => {
    return await exports.calculateValOfLpPositions(args.marketAddress, args.block);
};
const calculateValOfLpPositionsBatched = promises_tho_1.batch({ batchSize: 75 }, calculateValOfLpPositionsWrapper);
const calculateValOfLpPositionsAcrossBlocks = async (marketAddress, samples) => {
    console.log(`Calculating value of LP positions for market: ${marketAddress} across ${samples.length} samples!`);
    const args = [];
    for (const block of samples) {
        args.push({ marketAddress: marketAddress, block: block });
    }
    return await calculateValOfLpPositionsBatched(args);
};
exports.calculateValOfLpPositionsAcrossBlocks = calculateValOfLpPositionsAcrossBlocks;
