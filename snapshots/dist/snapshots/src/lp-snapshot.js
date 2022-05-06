"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLpSnapshot = void 0;
const fpmm_1 = require("./fpmm");
const block_numbers_1 = require("./block_numbers");
const lp_helpers_1 = require("./lp-helpers");
const lp_helpers_2 = require("./lp-helpers");
const memo_1 = require("./memo");
const NUMBER_OF_SAMPLES_PER_MARKET = 150;
/**
 * Generate a lp weighted token snapshot
 * @param endTimestamp
 * @param supply
 * @returns
 */
async function generateLpSnapshot(startTimestamp, endTimestamp, marketMakers, defaultBlocksPerSample, shouldThrowBlockOrderError, isEstimating, memoizeMarketInfo) {
    console.log(`Generating lp snapshot with timestamp: ${endTimestamp}`);
    let userTokensPerEpoch = {};
    let markets = lp_helpers_1.lowerCaseMarketMakers(marketMakers);
    if (memoizeMarketInfo) {
        const { epoch, tokenSymbol } = memoizeMarketInfo;
        const file = memo_1.getMemoFile(epoch, tokenSymbol);
        console.log("memoizedFileToStart", file);
        if (file) {
            userTokensPerEpoch = Object.assign({}, file.memoizedUserTokensPerEpoch);
            markets = markets.filter((m) => file.marketMakersInMap[m.marketMaker] === undefined);
            console.log("markets");
        }
        else {
            memo_1.setMemoFile(tokenSymbol, epoch, {
                marketMakersInMap: {},
                memoizedUserTokensPerEpoch: {},
            });
        }
    }
    let epochEndBlock = await block_numbers_1.convertTimestampToBlockNumber(endTimestamp);
    while (!epochEndBlock) {
        console.log("epochEndBlock was not found. trying again!");
        epochEndBlock = await block_numbers_1.convertTimestampToBlockNumber(endTimestamp);
    }
    let epochStartBlock = await block_numbers_1.convertTimestampToBlockNumber(startTimestamp);
    while (!epochStartBlock) {
        console.log("epochStartBlock was not found. trying again!");
        epochStartBlock = await block_numbers_1.convertTimestampToBlockNumber(startTimestamp);
    }
    const now = Date.now();
    for (const market of markets) {
        let blocksPerSample = defaultBlocksPerSample;
        console.log("***********************************");
        const { marketMaker } = market;
        const marketStartBlock = await block_numbers_1.getStartBlock(marketMaker);
        const marketEndBlock = await block_numbers_1.getEndBlock(marketMaker);
        let rewardMarketEndBlock = null;
        if (market.rewardMarketEndDate) {
            console.log("reward market end date exists, getting block!");
            while (!rewardMarketEndBlock) {
                console.log("reward market end block was not found. trying again!");
                rewardMarketEndBlock = await block_numbers_1.convertTimestampToBlockNumber(market.rewardMarketEndDate);
            }
        }
        let rewardMarketStartBlock = null;
        if (market.rewardMarketStartDate) {
            console.log("reward market start date exists, getting block!");
            while (!rewardMarketStartBlock) {
                console.log("reward market start block was not found. trying again!");
                rewardMarketStartBlock = await block_numbers_1.convertTimestampToBlockNumber(market.rewardMarketStartDate);
            }
        }
        let eventStartBlock = null;
        if (market.eventStartDate) {
            console.log("event start date exists, getting block!");
            while (!eventStartBlock) {
                console.log("event start block was not found. trying again!");
                eventStartBlock = await block_numbers_1.convertTimestampToBlockNumber(market.eventStartDate);
            }
        }
        const { startBlock, endBlock: eb } = lp_helpers_2.getStartAndEndBlock({
            epochStartBlock,
            epochEndBlock,
            marketStartBlock,
            marketEndBlock,
            rewardMarketEndBlock,
            rewardMarketStartBlock,
        });
        const currentBlock = await block_numbers_1.getCurrentBlockNumber();
        // if epoch has not ended and market has not resolved, get current block
        const endBlock = !eb ? currentBlock : eb;
        console.log({
            epochStartBlock,
            marketStartBlock,
            rewardMarketStartBlock,
            rewardMarketEndBlock,
            marketEndBlock,
            epochEndBlock,
            currentBlock,
        });
        console.log({
            startBlockBeingUsed: startBlock,
            eventStartBlock,
            endBlockBeingUsed: endBlock,
            diffBetweenNowAndEndBlock: currentBlock - endBlock,
        });
        // roughly, if our systems can handle ~150 samples per epoc
        // then we should take reward_market_start & reward_market_end diff and divide by 150
        if (rewardMarketStartBlock && rewardMarketEndBlock) {
            blocksPerSample = lp_helpers_1.calculateSamplesPerEvent(rewardMarketStartBlock, rewardMarketEndBlock, NUMBER_OF_SAMPLES_PER_MARKET);
            console.log(`Reward market start and end block exist. There are ${blocksPerSample} blocks per sample`);
            if (eventStartBlock) {
                console.log("market maker of market with event", marketMaker);
                const blockOrderError = lp_helpers_1.validateEventStartBlock(rewardMarketStartBlock, eventStartBlock, rewardMarketEndBlock, marketMaker);
                if (blockOrderError && shouldThrowBlockOrderError) {
                    console.log("blockOrderError", blockOrderError);
                    throw new Error(blockOrderError);
                }
                if (blockOrderError && !shouldThrowBlockOrderError) {
                    console.log("\n\n\n\n\n\n", "block order error during estimation, not using market: " +
                        marketMaker, "\n\n\n\n\n\n");
                    continue;
                }
            }
        }
        const arrayOfSamples = lp_helpers_1.createArrayOfSamples(startBlock, endBlock, eventStartBlock, blocksPerSample);
        console.log("blocksPerSample", blocksPerSample);
        console.log(`There are ${arrayOfSamples.length} sets of samples of blocks`);
        if (arrayOfSamples.length === 2 &&
            typeof market.preEventPercent !== "number") {
            throw new Error("If you specify an event, you must also add percents for pre event and event!");
        }
        for (let idx = 0; idx < arrayOfSamples.length; idx++) {
            const samples = arrayOfSamples[idx];
            const allBlocks = await fpmm_1.calculateValOfLpPositionsAcrossBlocks(marketMaker, samples);
            console.log("THE NUMBER OF SAMPLES LOGGED ABOVE SHOULD NEVER BE ABOVE " +
                NUMBER_OF_SAMPLES_PER_MARKET);
            // filter out undefined/null blocks
            const liquidityAcrossBlocks = allBlocks.filter((block) => block);
            if (allBlocks && liquidityAcrossBlocks) {
                // if there are two arrays of blocks, the [1] blocks must be during the event
                let weight = 1;
                if (typeof market.preEventPercent === "number") {
                    weight =
                        idx === 0
                            ? market.preEventPercent
                            : 1 - market.preEventPercent;
                }
                let tokensPerSample;
                if (isEstimating) {
                    const startTime = market.rewardMarketStartDate
                        ? new Date(market.rewardMarketStartDate).getTime()
                        : startTimestamp;
                    const endTime = market.rewardMarketEndDate
                        ? new Date(market.rewardMarketEndDate).getTime()
                        : endTimestamp;
                    const eventStartTime = market.eventStartDate
                        ? new Date(market.eventStartDate).getTime()
                        : null;
                    const percentOfSampleBeingUsed = lp_helpers_1.calculatePercentOfSampleToUse(idx === 1, // isSampleDuringEvent
                    {
                        startTime,
                        now,
                        eventStartTime,
                        endTime,
                    });
                    console.log(`Using ${percentOfSampleBeingUsed * 100}% of sample`);
                    tokensPerSample =
                        percentOfSampleBeingUsed *
                            lp_helpers_1.calculateTokensPerSample(market.amount, samples.length, weight);
                }
                else {
                    tokensPerSample = lp_helpers_1.calculateTokensPerSample(market.amount, samples.length, weight);
                }
                console.log(`Using ${tokensPerSample} tokens per sample`);
                console.log(`Using ${weight} for weight`);
                console.log(`Using ${tokensPerSample / blocksPerSample} tokens per block`);
                userTokensPerEpoch = await lp_helpers_1.updateTokensPerBlockReward(userTokensPerEpoch, liquidityAcrossBlocks, tokensPerSample);
                if (memoizeMarketInfo) {
                    const { epoch, tokenSymbol } = memoizeMarketInfo;
                    const { marketMakersInMap } = memo_1.getMemoFile(epoch, tokenSymbol);
                    memo_1.setMemoFile(tokenSymbol, epoch, {
                        marketMakersInMap: Object.assign(Object.assign({}, marketMakersInMap), { [market.marketMaker]: true }),
                        memoizedUserTokensPerEpoch: Object.assign({}, userTokensPerEpoch),
                    });
                }
            }
            else {
                console.log(`NO BLOCKS WITH LPs WERE FOUND!`);
                continue;
            }
        }
    }
    return userTokensPerEpoch;
}
exports.generateLpSnapshot = generateLpSnapshot;
