import { sumValues, combineMaps, makePayoutsMap } from "./helpers";
import { MapOfCount } from "./interfaces";
import { BigNumber } from "@ethersproject/bignumber";

// TYPES
export interface IStartAndEndBlock {
    epochStartBlock: number | null;
    epochEndBlock: number | null;
    marketStartBlock: number | null;
    marketEndBlock: number | null;
    rewardMarketEndBlock: number | null;
    rewardMarketStartBlock: number | null;
}

export interface LpMarketInfo {
    marketMaker: string;
    howToCalculate: LpCalculation;
    amount: number;
    rewardMarketEndDate: number | null;
    rewardMarketStartDate: number | null;
    eventStartDate: number | null;
    preEventPercent: number | null;
}

export enum LpCalculation {
    PerBlock = "perBlock",
    PerMarket = "perMarket",
}

export interface RewardTokenLiquidity {
    reward_token: RewardToken;
    token_calculation: LpCalculation;
    lp_token_supply: string;
}

export interface RewardMarketFromStrapi {
    reward_epoch: number;
    reward_end_date: null | string;
    reward_start_date: null | string;
    reward_tokens_liquidity: RewardTokenLiquidity[];
    event_start_date: null | string;
    pre_event_percent: null | string;
    market: {
        marketMakerAddress: string;
    };
}

interface StrapiFormat {
    name: string;
    hash: string;
    ext: string;
    mime: string;
    width: number;
    height: number;
    size: number;
    path: string;
    url: string;
}

interface StrapiIcon {
    id: number;
    alternativeText: string;
    caption: string;
    hash: string;
    ext: string;
    mime: string;
    previewUrl: null;
    provider: string;
    name: string;
    width: number;
    height: number;
    size: number;
    url: string;
    formats: {
        thumbnail: StrapiFormat;
        large: StrapiFormat;
        medium: StrapiFormat;
        small: StrapiFormat;
    };
}

export interface RewardToken {
    id: number;
    symbol: string;
    name: string;
    icon: StrapiIcon;
}

export interface RewardTokenFromStrapi {
    reward_token: RewardToken;
    amm_fees_token_supply: string;
    clob_fees_token_supply: string;
    clob_liqudity_token_supply: string;
}

export interface RewardEpochFromStrapi {
    start: string;
    end: string;
    epoch: number;
    reward_tokens: RewardTokenFromStrapi[];
    reward_markets: RewardMarketFromStrapi[];
}

interface TokenMap {
    [tokenName: string]: {
        markets: LpMarketInfo[];
        feeTokenSupply: number;
        clobLiqSupply: number;
    };
}

interface CleanEpochInfo {
    startTimestamp: number;
    endTimestamp: number;
    epoch: number;
    tokenMap: TokenMap;
}

export enum BlockOrderError {
    NotSet = "all blocks are not set!",
    StartBeforeEventEnd = "reward market start block is after event block!",
    EndBeforeEventStart = "reward market end block is before event block!",
}

/**
 * Throws errors if properties we need from Strapi are not present
 * @param epochInfo
 * @returns boolean
 */
export const ensureGoodDataFromStrapi = (
    epochInfo: RewardEpochFromStrapi,
): boolean => {
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

    // if (!reward_markets || reward_markets.length === 0) {
    //     throw new Error("No Reward Markets!");
    // }

    if (!reward_tokens[0].amm_fees_token_supply) {
        throw new Error("No Fee Token Supply Set");
    }

    if (!reward_tokens[0].clob_liqudity_token_supply) {
        throw new Error("No CLOB Liqudity Token Supply Set");
    }

    if (!reward_tokens[0].reward_token || !reward_tokens[0].reward_token.name) {
        throw new Error("No Reward Token Set!");
    }

    // if (
    //     !reward_markets[0].market ||
    //     !reward_markets[0].market.marketMakerAddress
    // ) {
    //     throw new Error("No Market Maker Address!");
    // }

    return true;
};

const getDateMs = (date: null | string): null | number => {
    return typeof date === "string" ? new Date(date).getTime() : null;
};

/**
 * Takes liquidity payout info for markets and fee payout info for the epoch
 * cleans all info and creates a single map by token of markets liquidity payout and fee payouts
 * @param epochInfoFromStrapi
 * @returns cleanEpochInfo
 */
export const cleanAndSeparateEpochPerToken = (
    epochInfo: RewardEpochFromStrapi,
): CleanEpochInfo => {
    const feeMap = epochInfo.reward_tokens.reduce((acc, curr) => {
        if (!acc[curr.reward_token.id]) {
            acc[curr.reward_token.id] = {
                feeTokenSupply: BigNumber.from(
                    curr.amm_fees_token_supply,
                ).toNumber(),
            };
        }
        return acc;
    }, {});

    const clobLiqMap = epochInfo.reward_tokens.reduce((acc, curr) => {
        if (!acc[curr.reward_token.id]) {
            let supply: number;
            try {
                supply = BigNumber.from(
                    curr.clob_liqudity_token_supply,
                ).toNumber();
            } catch (e) {
                supply = 0;
            }
            acc[curr.reward_token.id] = {
                feeTokenSupply: supply,
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

            if (
                rewardMarketStartDate &&
                rewardMarketEndDate &&
                eventStartDate
            ) {
                const hasError = validateEventStartBlock(
                    rewardMarketStartDate,
                    eventStartDate,
                    rewardMarketEndDate,
                    marketMaker,
                );
                if (hasError) {
                    throw new Error(hasError);
                }
            }

            acc[token.reward_token.id].markets.push({
                amount: BigNumber.from(token.lp_token_supply).toNumber(),
                howToCalculate: token.token_calculation,
                marketMaker,
                rewardMarketStartDate,
                eventStartDate,
                preEventPercent:
                    typeof curr.pre_event_percent === "number"
                        ? curr.pre_event_percent / 100
                        : null,
                rewardMarketEndDate,
            });
        });
        return acc;
    }, {});

    const keys = [...new Set(Object.keys(feeMap).concat(Object.keys(liqMap)))];

    const tokenMap = keys.reduce((acc, tokenId) => {
        if (!acc[tokenId]) {
            acc[tokenId] = {
                markets: liqMap[tokenId]?.markets ?? [],
                feeTokenSupply: feeMap[tokenId]?.feeTokenSupply ?? 0,
                clobLiqSupply: clobLiqMap[tokenId]?.feeTokenSupply ?? 0,
            };
        }

        return acc;
    }, {} as TokenMap);

    return {
        startTimestamp: new Date(epochInfo.start).getTime(),
        endTimestamp: new Date(epochInfo.end).getTime(),
        epoch: epochInfo.epoch,
        tokenMap,
    };
};

/**
 * Iterates over blocks and updates the userTokensPerEpoch map
 * According to a per BLOCK reward amount
 * @param userTokensPerEpoch
 * @param liquidityAcrossBlocks
 * @param perBlockReward
 * @returns MapOfCount
 */
export const updateTokensPerBlockReward = (
    userTokensPerEpoch: MapOfCount | Record<string, never>,
    liquidityAcrossBlocks: MapOfCount[],
    perBlockReward: number,
): MapOfCount => {
    let updatedMap = { ...userTokensPerEpoch };
    for (const liquidityAtBlock of liquidityAcrossBlocks) {
        const sumOfBlockLiquidity = sumValues(liquidityAtBlock);
        const blockPoints = makePayoutsMap(
            liquidityAtBlock,
            sumOfBlockLiquidity,
            perBlockReward,
        );
        updatedMap = combineMaps([blockPoints, updatedMap]);
    }
    return updatedMap;
};

/**
 * Takes in epoch and market start blocks and end blocks
 * Returns start block, end block and how to calculate the block rewards
 * @param epochEndBlock
 * @param epochStartBlock
 * @param marketStartBlock
 * @param marketEndBlock
 * @returns howToCalculate, startBlock, endBlock
 */
export const getStartAndEndBlock = ({
    epochStartBlock,
    epochEndBlock,
    marketStartBlock,
    marketEndBlock,
    rewardMarketEndBlock,
    rewardMarketStartBlock,
}: IStartAndEndBlock): {
    startBlock: number;
    endBlock: number | null;
} => {
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
    if (
        (epochStartBlock && epochStartBlock < marketStartBlock) ||
        !epochStartBlock
    ) {
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
    if (
        (epochEndBlock && marketEndBlock && epochEndBlock <= marketEndBlock) ||
        (epochEndBlock && !marketEndBlock)
    ) {
        endBlock = epochEndBlock;
    }

    // market ended before epoch or market ended and epoch has not finished
    if (
        (epochEndBlock && marketEndBlock && epochEndBlock > marketEndBlock) ||
        (!epochEndBlock && marketEndBlock)
    ) {
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

/**
 * Returns Market Info with the marketMaker address lowercased
 * @param LpMarketInfo[]
 * @returns LpMarketInfo[]
 */
export const lowerCaseMarketMakers = (
    markets: LpMarketInfo[],
): LpMarketInfo[] => {
    return markets.map((market) => ({
        ...market,
        marketMaker: market.marketMaker.toLowerCase(),
    }));
};

/**
 * Calculates the number of samples per market given a start block and end block
 * @param startBlock number
 * @param endBlock number
 * @param samplesPerMarket number
 * @returns numberOfSamples number
 */
export const calculateSamplesPerEvent = (
    startBlock: number,
    endBlock: number,
    samplesPerMarket: number,
): number => {
    const diff = endBlock - startBlock;
    const samples = Math.floor(diff / samplesPerMarket);
    return samples;
};

export const validateEventStartBlock = (
    startBlock: number,
    eventBlock: number,
    endBlock: number,
    marketMaker: string,
): string | null => {
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

export const createArrayOfSamples = (
    startBlock: number,
    endBlock: number,
    eventStartBlock: number | null,
    blocksPerSample: number,
): number[][] => {
    const arrayOfSamples: number[][] = [[]];

    for (let block = startBlock; block <= endBlock; block += blocksPerSample) {
        if (eventStartBlock && block >= eventStartBlock) {
            if (!arrayOfSamples[1]) {
                arrayOfSamples.push([]);
            }
            arrayOfSamples[1].push(block);
        } else {
            arrayOfSamples[0].push(block);
        }
    }

    return arrayOfSamples;
};

/**
 * Calculates how many tokens per sample of blocks
 * so we can always have consistent tokens per block calculation
 * @param market LpMarketInfo
 * @param numSamples number
 * @param blocksPerSample number
 * @returns tokensPerSample number
 */
export const calculateTokensPerSample = (
    amount: number,
    numSamples: number,
    percentOfTokens: number,
): number => {
    return (amount * percentOfTokens) / numSamples;
};

/**
 * Calculates what percent of supply to use during an estimation run
 * @param isSampleDuringEvent number
 * @param timestamps - startTime, now, eventStartTime, endTime
 * @returns tokensPerSample number
 */
export const calculatePercentOfSampleToUse = (
    isSampleDuringEvent: boolean,
    timestamps: {
        startTime: number;
        now: number;
        eventStartTime: number | null;
        endTime: number;
    },
): number => {
    const { now, startTime, endTime, eventStartTime } = timestamps;
    // if there is an event event, and the sample of timestamps is during event, then eventStartBlock is start block
    const sb =
        eventStartTime !== null && isSampleDuringEvent
            ? eventStartTime
            : startTime;

    if (sb === eventStartTime) {
        console.log("using eventStartTime as start:", sb);
    }

    if (now < sb) {
        console.log(
            `now: ${now} is before startTime: ${sb} - using NONE of the supply`,
        );
        return 0;
    }

    // if there is an event, and sample is before event, then end block is event start block
    const eb =
        eventStartTime !== null && !isSampleDuringEvent
            ? eventStartTime
            : endTime;

    if (eb === eventStartTime) {
        console.log("using eventStartTime as end block:", eb);
    }

    if (now >= eb) {
        console.log(
            `now: ${now} is after endTime: ${eb} - using ALL of the supply`,
        );
        return 1;
    }

    const percentOfSampleBeingUsed = (now - sb) / (eb - sb);
    return percentOfSampleBeingUsed;
};
