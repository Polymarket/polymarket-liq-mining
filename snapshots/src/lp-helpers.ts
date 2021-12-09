import { sumValues } from "./helpers";
import { MapOfCount } from "./interfaces";
import { LpCalculation } from "./lp-snapshot";


/**
 * Takes an array of liquidity across blocks
 * Returns a map of total liquidity for each address map across all blocks
 * @param liquidityAcrossBlocks
 * @returns MapOfCount
 */
export const makeLpPointsMap = (
  liquidityAcrossBlocks: MapOfCount[]
): MapOfCount => {
  const map = {};
  for (const liquidityAtBlock of liquidityAcrossBlocks) {
    for (const liquidityProvider of Object.keys(liquidityAtBlock)) {
      if (!map[liquidityProvider]) {
        map[liquidityProvider] = 0;
      }
      map[liquidityProvider] =
        map[liquidityProvider] + liquidityAtBlock[liquidityProvider];
    }
  }
  return map;
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
  const map = { ...userTokensPerEpoch };
  for (const liquidityAtBlock of liquidityAcrossBlocks) {
    const totalLiquidity = sumValues(liquidityAtBlock);
    for (const liquidityProvider of Object.keys(liquidityAtBlock)) {
      if (!map[liquidityProvider]) {
        map[liquidityProvider] = 0;
      }

      const portionOfBlockReward =
        liquidityAtBlock[liquidityProvider] / totalLiquidity;

      const newAmount =
        map[liquidityProvider] + portionOfBlockReward * perBlockReward;

      map[liquidityProvider] = newAmount;
    }
  }
  return map;
};

/**
 * Iterates over blocks and updates the userTokensPerEpoch map
 * According to a per EPOCH reward amount
 * @param userTokensPerEpoch
 * @param liquidityAcrossBlocks
 * @param supplyOfTokenForEpoch
 * @returns MapOfCount
 */
export const updateTokensPerEpochReward = (
  userTokensPerEpoch: MapOfCount | Record<string, never>,
  liquidityAcrossBlocks: MapOfCount[],
  supplyOfTokenForEpoch: number
): MapOfCount => {
  const map = { ...userTokensPerEpoch };
  const marketLpPoints = makeLpPointsMap(liquidityAcrossBlocks);
  const totalLiquidityPoints = sumValues(marketLpPoints);
  for (const liquidityProvider of Object.keys(marketLpPoints)) {
    if (!map[liquidityProvider]) {
      map[liquidityProvider] = 0;
    }
    const liquidityPointsPerLp = marketLpPoints[liquidityProvider];

    const rewardForMarket =
      (liquidityPointsPerLp / totalLiquidityPoints) * supplyOfTokenForEpoch;

    map[liquidityProvider] = map[liquidityProvider] + rewardForMarket;
  }
  return map;
};

export interface IStartAndEndBlock {
  epochStartBlock: number | null;
  epochEndBlock: number | null;
  marketStartBlock: number | null;
  marketEndBlock: number | null;
}

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
  howToCalculate: LpCalculation;
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
  let howToCalculate: LpCalculation;

  // market is live, epoch is live...
  if (!epochEndBlock && !marketEndBlock) {
    // get current block in case market has not ended and epoch end is in the future
    endBlock = null;
    howToCalculate = LpCalculation.PerEpoch;
  }

  // epoch ended before market or epoch ended and market is still live
  if (
    (epochEndBlock && marketEndBlock && epochEndBlock <= marketEndBlock) ||
    (epochEndBlock && !marketEndBlock)
  ) {
    endBlock = epochEndBlock;
    howToCalculate = LpCalculation.PerBlock;
  }

  // market ended before epoch or market ended and epoch has not finished
  if (
    (epochEndBlock && marketEndBlock && epochEndBlock > marketEndBlock) ||
    (!epochEndBlock && marketEndBlock)
  ) {
    endBlock = marketEndBlock;
    howToCalculate = LpCalculation.PerEpoch;
  }

  return {
    howToCalculate,
    startBlock,
    endBlock,
  };
};

