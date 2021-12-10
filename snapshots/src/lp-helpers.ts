import { sumValues, combineMaps, makePayoutsMap } from "./helpers";
import { MapOfCount } from "./interfaces";
import { LpCalculation } from "./lp-snapshot";

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
  let updatedMap = {...userTokensPerEpoch};
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
  const liquidityOfAllBlocks = combineMaps(liquidityAcrossBlocks);
  const totalLiquidity = sumValues(liquidityOfAllBlocks);
  const lpMap = makePayoutsMap(
    liquidityOfAllBlocks,
    totalLiquidity,
    supplyOfTokenForEpoch
  );
  return combineMaps([lpMap, userTokensPerEpoch]);
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
    howToCalculate = LpCalculation.TotalSupply;
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
    howToCalculate = LpCalculation.TotalSupply;
  }

  return {
    howToCalculate,
    startBlock,
    endBlock,
  };
};
