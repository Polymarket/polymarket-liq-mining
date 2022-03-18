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
import { getMemoFile, MemoizedFile, setMemoFile } from "./memo";
import { DEFAULT_BLOCKS_PER_SAMPLE } from './constants';

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
    defaultBlocksPerSample: number,
    shouldThrowBlockOrderError: boolean,
    memoizeMarketInfo?: { epoch: number; tokenSymbol: string },
): Promise<MapOfCount> {
    console.log(`Generating lp snapshot with timestamp: ${endTimestamp}`);

    let userTokensPerEpoch: { [proxyWallet: string]: number } = {};
    let markets = lowerCaseMarketMakers(marketMakers);

    if (memoizeMarketInfo) {
        const { epoch, tokenSymbol } = memoizeMarketInfo;
        const file: MemoizedFile = getMemoFile(epoch, tokenSymbol);
        console.log("memoizedFileToStart", file);
        if (file) {
            userTokensPerEpoch = { ...file.memoizedUserTokensPerEpoch };
            markets = markets.filter(
                (m) => file.marketMakersInMap[m.marketMaker] === undefined,
            );
            console.log("markets");
        } else {
            setMemoFile(tokenSymbol, epoch, {
                marketMakersInMap: {},
                memoizedUserTokensPerEpoch: {},
            });
        }
    }

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
		let blocksPerSample = defaultBlocksPerSample
		console.log('***********************************')
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

        // roughly, if our systems can handle ~150 samples per epoc
        // then we should take reward_market_start & reward_market_end diff and divide by 150
        if (rewardMarketStartBlock && rewardMarketEndBlock) {
            blocksPerSample = calculateSamplesPerEvent(
                rewardMarketStartBlock,
                rewardMarketEndBlock,
                NUMBER_OF_SAMPLES_PER_MARKET,
            );

            console.log(
                `Reward market start and end block exist. There are ${blocksPerSample} blocks per sample`,
            );

            if (eventStartBlock) {
                console.log("market maker of market with event", marketMaker);
                const blockOrderError = validateEventStartBlock(
                    rewardMarketStartBlock,
                    eventStartBlock,
                    rewardMarketEndBlock,
                    marketMaker,
                );
                if (blockOrderError && shouldThrowBlockOrderError) {
                    console.log("blockOrderError", blockOrderError);
                    throw new Error(blockOrderError);
                }
                if (blockOrderError && !shouldThrowBlockOrderError) {
                    console.log(
                        "\n\n\n\n\n\n",
                        "block order error during estimation, not using market: " +
                            marketMaker,
                        "\n\n\n\n\n\n",
                    );
                    continue;
                }
            }
        }

        const arrayOfSamples = createArrayOfSamples(
            startBlock,
            endBlock,
            eventStartBlock,
            blocksPerSample,
        );

		console.log('blocksPerSample', blocksPerSample)
        console.log(
            `There are ${arrayOfSamples.length} sets of samples of blocks`,
        );

        if (
            arrayOfSamples.length === 2 &&
            typeof market.preEventPercent !== "number"
        ) {
            throw new Error(
                "If you specify an event, you must also add percents for pre event and event!",
            );
        }

        for (let idx = 0; idx < arrayOfSamples.length; idx++) {
            const samples = arrayOfSamples[idx];
            const liquidityAcrossBlocks =
                await calculateValOfLpPositionsAcrossBlocks(
                    marketMaker,
                    samples,
                );
			console.log('THE NUMBER OF SAMPLES LOGGED ABOVE SHOULD NEVER BE ABOVE' + DEFAULT_BLOCKS_PER_SAMPLE)

            if (liquidityAcrossBlocks) {
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

                userTokensPerEpoch = await updateTokensPerBlockReward(
                    userTokensPerEpoch,
                    liquidityAcrossBlocks,
                    tokensPerSample,
                );

                if (memoizeMarketInfo) {
                    const { epoch, tokenSymbol } = memoizeMarketInfo;
                    const { marketMakersInMap } = getMemoFile(
                        epoch,
                        tokenSymbol,
                    );

                    setMemoFile(tokenSymbol, epoch, {
                        marketMakersInMap: {
                            ...marketMakersInMap,
                            [market.marketMaker]: true,
                        },
                        memoizedUserTokensPerEpoch: { ...userTokensPerEpoch },
                    });
                }

                console.log(`Using ${tokensPerSample} tokens per sample`);
                console.log(
                    `Using ${
                        tokensPerSample / blocksPerSample
                    } tokens per block`,
                );
            }
        }
    }

    return userTokensPerEpoch;
}
