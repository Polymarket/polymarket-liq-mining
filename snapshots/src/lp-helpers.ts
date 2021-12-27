import { sumValues, combineMaps, makePayoutsMap } from "./helpers";
import { MapOfCount } from "./interfaces";

// TYPES
export interface IStartAndEndBlock {
  epochStartBlock: number | null;
  epochEndBlock: number | null;
  marketStartBlock: number | null;
  marketEndBlock: number | null;
}

export interface LpMarketInfo {
  marketMaker: string;
  howToCalculate: LpCalculation;
  amount: number;
}

export enum LpCalculation {
  PerBlock = "perBlock",
  PerMarket = "perMarket",
}

export interface RewardMarketFromStrapi {
  lp_token_supply: number;
  token_calculation: LpCalculation;
  market: {
    marketMakerAddress: string;
  };
  reward_epoch: number;
}

export interface RewardEpochFromStrapi {
  start: string;
  end: string;
  epoch: number;
  fee_token_supply: number;
  reward_markets: RewardMarketFromStrapi[];
}

interface CleanEpochInfo {
  startTimestamp: number;
  endTimestamp: number;
  markets: LpMarketInfo[];
  epoch: number;
  feeTokenSupply: number;
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
  const { start, end, epoch, fee_token_supply, reward_markets } = epochInfo;
  if (!start || !end) {
    throw new Error("Dates not set!");
  }
  if (!epoch) {
    throw new Error("Epoch not set!");
  }

  if (!fee_token_supply) {
    throw new Error("Fee Token supply not set!");
  }
  if (!reward_markets || reward_markets.length === 0) {
    throw new Error("No Reward Markets!");
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
 * Takes camel case reward market data from strapi
 * Returns clean reward market data
 * @param epochInfoFromStrapi
 * @returns cleanEpochInfo
 */
const cleanMarketDataFromStrapi = (
  markets: RewardMarketFromStrapi[]
): LpMarketInfo[] => {
  const toCamelCase = markets.map((m) => ({
    amount: m.lp_token_supply,
    howToCalculate: m.token_calculation,
    marketMaker: m.market.marketMakerAddress,
  }));
  return lowerCaseMarketMakers(toCamelCase);
};

/**
 * Takes camel case reward epoch data from strapi
 * Returns clean reward epoch data
 * @param epochInfoFromStrapi
 * @returns cleanEpochInfo
 */
export const cleanEpochInfoFromStrapi = (
  epochInfo: RewardEpochFromStrapi
): CleanEpochInfo => ({
  startTimestamp: new Date(epochInfo.start).getTime(),
  endTimestamp: new Date(epochInfo.end).getTime(),
  markets: cleanMarketDataFromStrapi(epochInfo.reward_markets),
  feeTokenSupply: epochInfo.fee_token_supply,
  epoch: epochInfo.epoch,
});

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
}: IStartAndEndBlock): {
  startBlock: number;
  endBlock: number | null;
} => {
  //
  if (!epochStartBlock && !marketStartBlock) {
    throw new Error("The market and epoch have not started!");
  }

  // the market has not started!
  if (!marketStartBlock) {
    throw new Error("The market has not started!");
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

  let endBlock;

  // market is live, epoch is live...
  if (!epochEndBlock && !marketEndBlock) {
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
