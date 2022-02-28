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
  fees_token_supply: string;
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
  };
}

interface CleanEpochInfo {
  startTimestamp: number;
  endTimestamp: number;
  epoch: number;
  tokenMap: TokenMap;
}
/**
 * Throws errors if properties we need from Strapi are not present
 * @param epochInfo
 * @returns boolean
 */
export const ensureGoodDataFromStrapi = (
  epochInfo: RewardEpochFromStrapi
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

  if (!reward_markets || reward_markets.length === 0) {
    throw new Error("No Reward Markets!");
  }

  if (!reward_tokens[0].fees_token_supply) {
    throw new Error("No Fee Token Supply Set");
  }

  if (!reward_tokens[0].reward_token || !reward_tokens[0].reward_token.name) {
    throw new Error("No Reward Token Set!");
  }

  if (
    !reward_markets[0].market ||
    !reward_markets[0].market.marketMakerAddress
  ) {
    throw new Error("No Market Maker Address!");
  }

  return true;
};

/**
 * Takes liquidity payout info for markets and fee payout info for the epoch
 * cleans all info and creates a single map by token of markets liquidity payout and fee payouts
 * @param epochInfoFromStrapi
 * @returns cleanEpochInfo
 */
export const cleanAndSeparateEpochPerToken = (
  epochInfo: RewardEpochFromStrapi
): CleanEpochInfo => {
  const feeMap = epochInfo.reward_tokens.reduce((acc, curr) => {
    if (!acc[curr.reward_token.id]) {
      acc[curr.reward_token.id] = {
        feeTokenSupply: BigNumber.from(curr.fees_token_supply).toNumber(),
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
      acc[token.reward_token.id].markets.push({
        amount: BigNumber.from(token.lp_token_supply).toNumber(),
        howToCalculate: token.token_calculation,
        marketMaker: curr.market.marketMakerAddress.toLowerCase(),
        rewardMarketEndDate:
          typeof curr.reward_end_date === "string"
            ? new Date(curr.reward_end_date).getTime()
            : null,
        rewardMarketStartDate:
          typeof curr.reward_start_date === "string"
            ? new Date(curr.reward_end_date)
            : null,
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
  perBlockReward: number
): MapOfCount => {
  let updatedMap = { ...userTokensPerEpoch };
  for (const liquidityAtBlock of liquidityAcrossBlocks) {
    const sumOfBlockLiquidity = sumValues(liquidityAtBlock);
    const blockPoints = makePayoutsMap(
      liquidityAtBlock,
      sumOfBlockLiquidity,
      perBlockReward
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
  markets: LpMarketInfo[]
): LpMarketInfo[] => {
  return markets.map((market) => ({
    ...market,
    marketMaker: market.marketMaker.toLowerCase(),
  }));
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
  market: LpMarketInfo,
  numSamples: number,
  blocksPerSample: number
): number => {
  return market.howToCalculate === LpCalculation.PerMarket
    ? market.amount / numSamples
    : market.amount * blocksPerSample;
};
