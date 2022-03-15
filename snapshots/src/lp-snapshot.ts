import { calculateValOfLpPositionsAcrossBlocks } from "./fpmm";
import {
    getStartBlock,
    getEndBlock,
    convertTimestampToBlockNumber,
    getCurrentBlockNumber,
} from "./block_numbers";
import {
    calculateSamplesPerEvent,
    calculateTokensPerSample,
    createArrayOfSamples,
    lowerCaseMarketMakers,
    LpMarketInfo,
    updateTokensPerBlockReward,
    validateEventStartBlock,
} from "./lp-helpers";
import { getStartAndEndBlock } from "./lp-helpers";
import { MapOfCount } from "./interfaces";

const NUMBER_OF_SAMPLES_PER_MARKET = 150;

/**
 * Generate a lp weighted token snapshot
 * @param endTimestamp
 * @param supply
 * @returns
 */
export async function generateLpSnapshot(
    startTimestamp: number,
    endTimestamp: number,
    marketMakers: LpMarketInfo[],
    blocksPerSample: number,
	shouldThrowBlockOrderError: boolean
): Promise<MapOfCount> {
    console.log(`Generating lp snapshot with timestamp: ${endTimestamp}`);

    let userTokensPerEpoch: { [proxyWallet: string]: number } = {};
    const markets = lowerCaseMarketMakers(marketMakers);

    let epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
    while (!epochEndBlock) {
        console.log("epochEndBlock was not found. trying again!");
        epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
    }

    let epochStartBlock = await convertTimestampToBlockNumber(startTimestamp);
    while (!epochStartBlock) {
        console.log("epochStartBlock was not found. trying again!");
        epochStartBlock = await convertTimestampToBlockNumber(startTimestamp);
    }

    for (const market of markets) {
        const { marketMaker } = market;
        const marketStartBlock = await getStartBlock(marketMaker);
        const marketEndBlock = await getEndBlock(marketMaker);

        let rewardMarketEndBlock = null;
        if (market.rewardMarketEndDate) {
            console.log("reward market end date exists, getting block!");
            while (!rewardMarketEndBlock) {
                console.log(
                    "reward market end block was not found. trying again!",
                );
                rewardMarketEndBlock = await convertTimestampToBlockNumber(
                    market.rewardMarketEndDate,
                );
            }
        }

        let rewardMarketStartBlock = null;
        if (market.rewardMarketStartDate) {
            console.log("reward market start date exists, getting block!");
            while (!rewardMarketStartBlock) {
                console.log(
                    "reward market start block was not found. trying again!",
                );
                rewardMarketStartBlock = await convertTimestampToBlockNumber(
                    market.rewardMarketStartDate,
                );
            }
        }

        let eventStartBlock = null;
        if (market.eventStartDate) {
            console.log("event start date exists, getting block!");
            while (!eventStartBlock) {
                console.log("event start block was not found. trying again!");
                eventStartBlock = await convertTimestampToBlockNumber(
                    market.eventStartDate,
                );
            }
        }

        const { startBlock, endBlock: eb } = getStartAndEndBlock({
            epochStartBlock,
            epochEndBlock,
            marketStartBlock,
            marketEndBlock,
            rewardMarketEndBlock,
            rewardMarketStartBlock,
        });

        const currentBlock = await getCurrentBlockNumber();
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

        // roughly, if our systems can handle ~150 samples per epoch
        // then we should take reward_market_start & reward_market_end diff and divide by 150
        if (rewardMarketStartBlock && rewardMarketEndBlock) {
            blocksPerSample = calculateSamplesPerEvent(
                rewardMarketStartBlock,
                rewardMarketEndBlock,
                NUMBER_OF_SAMPLES_PER_MARKET,
            );
            console.log(
                `Reward market start and end block exist. Custom sample size: ${blocksPerSample}`,
            );

            if (eventStartBlock) {
                console.log("market maker of market with event", marketMaker);
                const blockOrderError =  validateEventStartBlock(
                    rewardMarketStartBlock,
                    eventStartBlock,
                    rewardMarketEndBlock,
                    marketMaker,
                );
				if (blockOrderError && shouldThrowBlockOrderError) {
					throw new Error(blockOrderError)
				}
				if (blockOrderError && !shouldThrowBlockOrderError) {
					console.log('block order error during estimation, not using this market')
					return 
				}
            }
        }

        const arrayOfSamples = createArrayOfSamples(
            startBlock,
            endBlock,
            eventStartBlock,
            blocksPerSample,
        );

        // console.log(`arrayOfSamples length: ${arrayOfSamples.length}`);

        if (
            arrayOfSamples.length === 2 &&
            typeof market.preEventPercent !== "number"
        ) {
            throw new Error(
                "If you specify an event, you must also add percents for pre event and event!",
            );
        }

        arrayOfSamples.forEach(async (samples, idx) => {
            const liquidityAcrossBlocks =
                await calculateValOfLpPositionsAcrossBlocks(
                    marketMaker,
                    samples,
                );

            console.log(`number of samples: ${samples.length}`);
            // if there are two arrays of blocks, the [1] blocks must be during the event
            let weight = 1;
            if (typeof market.preEventPercent === "number") {
                weight =
                    idx === 0
                        ? market.preEventPercent
                        : 1 - market.preEventPercent;
            }

            const tokensPerSample = calculateTokensPerSample(
                market,
                samples.length,
                blocksPerSample,
                weight,
            );

            console.log(`Using ${market.howToCalculate} calculation`);
            console.log(`Using ${weight} for weight`);

            userTokensPerEpoch = updateTokensPerBlockReward(
                userTokensPerEpoch,
                liquidityAcrossBlocks,
                tokensPerSample,
            );

            console.log(`Using ${tokensPerSample} tokens per sample`);
            console.log(
                `Using ${tokensPerSample / blocksPerSample} tokens per block`,
            );
        });
    }

    return userTokensPerEpoch;
}
