"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArrayOfSamples = exports.validateEventStartBlock = exports.calculateSamplesPerEvent = exports.calculateTokensPerSample = exports.lowerCaseMarketMakers = exports.getStartAndEndBlock = exports.updateTokensPerBlockReward = exports.cleanAndSeparateEpochPerToken = exports.ensureGoodDataFromStrapi = exports.BlockOrderError = exports.LpCalculation = void 0;
const helpers_1 = require("./helpers");
const bignumber_1 = require("@ethersproject/bignumber");
var LpCalculation;
(function (LpCalculation) {
    LpCalculation["PerBlock"] = "perBlock";
    LpCalculation["PerMarket"] = "perMarket";
})(LpCalculation = exports.LpCalculation || (exports.LpCalculation = {}));
var BlockOrderError;
(function (BlockOrderError) {
    BlockOrderError["NotSet"] = "all blocks are not set!";
    BlockOrderError["StartBeforeEventEnd"] = "reward market start block is after event block!";
    BlockOrderError["EndBeforeEventStart"] = "reward market end block is before event block!";
})(BlockOrderError = exports.BlockOrderError || (exports.BlockOrderError = {}));
/**
 * Throws errors if properties we need from Strapi are not present
 * @param epochInfo
 * @returns boolean
 */
const ensureGoodDataFromStrapi = (epochInfo) => {
    if (!epochInfo) {
        throw new Error("Epoch Info Error!");
    }
    const { start, end, epoch, reward_tokens, reward_markets } = epochInfo;
    if (!start || !end) {
        throw new Error("Dates not set!");
    }
    if (typeof epoch !== "number") {
        throw new Error("Epoch not set!");
    }
    if (!reward_tokens || reward_tokens.length === 0) {
        throw new Error("No Reward Tokens!");
    }
    if (!reward_markets || reward_markets.length === 0) {
        throw new Error("No Reward Markets!");
    }
    if (!reward_tokens[0].fees_token_supply) {
        throw new Error("No Fee Token Supply Set");
    }
    if (!reward_tokens[0].reward_token || !reward_tokens[0].reward_token.name) {
        throw new Error("No Reward Token Set!");
    }
    if (!reward_markets[0].market ||
        !reward_markets[0].market.marketMakerAddress) {
        throw new Error("No Market Maker Address!");
    }
    return true;
};
exports.ensureGoodDataFromStrapi = ensureGoodDataFromStrapi;
const getDateMs = (date) => {
    return typeof date === "string" ? new Date(date).getTime() : null;
};
/**
 * Takes liquidity payout info for markets and fee payout info for the epoch
 * cleans all info and creates a single map by token of markets liquidity payout and fee payouts
 * @param epochInfoFromStrapi
 * @returns cleanEpochInfo
 */
const cleanAndSeparateEpochPerToken = (epochInfo) => {
    const feeMap = epochInfo.reward_tokens.reduce((acc, curr) => {
        if (!acc[curr.reward_token.id]) {
            acc[curr.reward_token.id] = {
                feeTokenSupply: bignumber_1.BigNumber.from(curr.fees_token_supply).toNumber(),
            };
        }
        return acc;
    }, {});
    const liqMap = epochInfo.reward_markets.reduce((acc, curr) => {
        curr.reward_tokens_liquidity.forEach((token) => {
            if (!acc[token.reward_token.id]) {
                acc[token.reward_token.id] = {
                    markets: [],
                };
            }
            const rewardMarketStartDate = getDateMs(curr.reward_start_date);
            const eventStartDate = getDateMs(curr.event_start_date);
            const rewardMarketEndDate = getDateMs(curr.reward_end_date);
            const marketMaker = curr.market.marketMakerAddress.toLowerCase();
            if (rewardMarketStartDate &&
                rewardMarketEndDate &&
                eventStartDate) {
                const hasError = exports.validateEventStartBlock(rewardMarketStartDate, eventStartDate, rewardMarketEndDate, marketMaker);
                if (hasError) {
                    throw new Error(hasError);
                }
            }
            acc[token.reward_token.id].markets.push({
                amount: bignumber_1.BigNumber.from(token.lp_token_supply).toNumber(),
                howToCalculate: token.token_calculation,
                marketMaker,
                rewardMarketStartDate,
                eventStartDate,
                preEventPercent: typeof curr.pre_event_percent === "number"
                    ? curr.pre_event_percent / 100
                    : null,
                rewardMarketEndDate,
            });
        });
        return acc;
    }, {});
    const keys = [...new Set(Object.keys(feeMap).concat(Object.keys(liqMap)))];
    const tokenMap = keys.reduce((acc, tokenId) => {
        var _a, _b, _c, _d;
        if (!acc[tokenId]) {
            acc[tokenId] = {
                markets: (_b = (_a = liqMap[tokenId]) === null || _a === void 0 ? void 0 : _a.markets) !== null && _b !== void 0 ? _b : [],
                feeTokenSupply: (_d = (_c = feeMap[tokenId]) === null || _c === void 0 ? void 0 : _c.feeTokenSupply) !== null && _d !== void 0 ? _d : 0,
            };
        }
        return acc;
    }, {});
    return {
        startTimestamp: new Date(epochInfo.start).getTime(),
        endTimestamp: new Date(epochInfo.end).getTime(),
        epoch: epochInfo.epoch,
        tokenMap,
    };
};
exports.cleanAndSeparateEpochPerToken = cleanAndSeparateEpochPerToken;
/**
 * Iterates over blocks and updates the userTokensPerEpoch map
 * According to a per BLOCK reward amount
 * @param userTokensPerEpoch
 * @param liquidityAcrossBlocks
 * @param perBlockReward
 * @returns MapOfCount
 */
const updateTokensPerBlockReward = (userTokensPerEpoch, liquidityAcrossBlocks, perBlockReward) => {
    let updatedMap = Object.assign({}, userTokensPerEpoch);
    for (const liquidityAtBlock of liquidityAcrossBlocks) {
        const sumOfBlockLiquidity = helpers_1.sumValues(liquidityAtBlock);
        const blockPoints = helpers_1.makePayoutsMap(liquidityAtBlock, sumOfBlockLiquidity, perBlockReward);
        updatedMap = helpers_1.combineMaps([blockPoints, updatedMap]);
    }
    return updatedMap;
};
exports.updateTokensPerBlockReward = updateTokensPerBlockReward;
/**
 * Takes in epoch and market start blocks and end blocks
 * Returns start block, end block and how to calculate the block rewards
 * @param epochEndBlock
 * @param epochStartBlock
 * @param marketStartBlock
 * @param marketEndBlock
 * @returns howToCalculate, startBlock, endBlock
 */
const getStartAndEndBlock = ({ epochStartBlock, epochEndBlock, marketStartBlock, marketEndBlock, rewardMarketEndBlock, rewardMarketStartBlock, }) => {
    if (!marketStartBlock) {
        throw new Error("The market has not started!");
    }
    if (!epochStartBlock) {
        throw new Error("The epoch has not started!");
    }
    let startBlock;
    // epoch started after market
    if (epochStartBlock && epochStartBlock >= marketStartBlock) {
        startBlock = epochStartBlock;
    }
    // epoch started before market or epoch has not started
    if ((epochStartBlock && epochStartBlock < marketStartBlock) ||
        !epochStartBlock) {
        startBlock = marketStartBlock;
    }
    // if rewardMarket has a specific start date, use it
    if (rewardMarketStartBlock) {
        startBlock = rewardMarketStartBlock;
    }
    let endBlock;
    // market is live, epoch is live...
    if (!epochEndBlock && !marketEndBlock && !rewardMarketEndBlock) {
        // get current block in case market has not ended and epoch end is in the future
        endBlock = null;
    }
    // epoch ended before market or epoch ended and market is still live
    if ((epochEndBlock && marketEndBlock && epochEndBlock <= marketEndBlock) ||
        (epochEndBlock && !marketEndBlock)) {
        endBlock = epochEndBlock;
    }
    // market ended before epoch or market ended and epoch has not finished
    if ((epochEndBlock && marketEndBlock && epochEndBlock > marketEndBlock) ||
        (!epochEndBlock && marketEndBlock)) {
        endBlock = marketEndBlock;
    }
    // if rewardMarket has a specific end date, use it
    if (rewardMarketEndBlock) {
        endBlock = rewardMarketEndBlock;
    }
    return {
        startBlock,
        endBlock,
    };
};
exports.getStartAndEndBlock = getStartAndEndBlock;
/**
 * Returns Market Info with the marketMaker address lowercased
 * @param LpMarketInfo[]
 * @returns LpMarketInfo[]
 */
const lowerCaseMarketMakers = (markets) => {
    return markets.map((market) => (Object.assign(Object.assign({}, market), { marketMaker: market.marketMaker.toLowerCase() })));
};
exports.lowerCaseMarketMakers = lowerCaseMarketMakers;
/**
 * Calculates how many tokens per sample of blocks
 * so we can always have consistent tokens per block calculation
 * @param market LpMarketInfo
 * @param numSamples number
 * @param blocksPerSample number
 * @returns tokensPerSample number
 */
const calculateTokensPerSample = (market, numSamples, blocksPerSample, percentOfTokens) => {
    return market.howToCalculate === LpCalculation.PerMarket
        ? (market.amount * percentOfTokens) / numSamples
        : market.amount * percentOfTokens * blocksPerSample;
};
exports.calculateTokensPerSample = calculateTokensPerSample;
/**
 * Calculates the number of samples per market given a start block and end block
 * @param startBlock number
 * @param endBlock number
 * @param samplesPerMarket number
 * @returns numberOfSamples number
 */
const calculateSamplesPerEvent = (startBlock, endBlock, samplesPerMarket) => {
    const diff = endBlock - startBlock;
    const samples = Math.floor(diff / samplesPerMarket);
    return samples;
};
exports.calculateSamplesPerEvent = calculateSamplesPerEvent;
const validateEventStartBlock = (startBlock, eventBlock, endBlock, marketMaker) => {
    console.log("in validateEventStartBlock, market maker:", marketMaker);
    if (!startBlock || !eventBlock || !endBlock) {
        return BlockOrderError.NotSet;
    }
    if (startBlock > eventBlock) {
        return BlockOrderError.StartBeforeEventEnd;
    }
    if (endBlock < eventBlock) {
        return BlockOrderError.EndBeforeEventStart;
    }
    return null;
};
exports.validateEventStartBlock = validateEventStartBlock;
const createArrayOfSamples = (startBlock, endBlock, eventStartBlock, blocksPerSample) => {
    const arrayOfSamples = [[]];
    for (let block = startBlock; block <= endBlock; block += blocksPerSample) {
        if (eventStartBlock && block >= eventStartBlock) {
            if (!arrayOfSamples[1]) {
                arrayOfSamples.push([]);
            }
            arrayOfSamples[1].push(block);
        }
        else {
            arrayOfSamples[0].push(block);
        }
    }
    return arrayOfSamples;
};
exports.createArrayOfSamples = createArrayOfSamples;
