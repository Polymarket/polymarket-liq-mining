import { LpCalculation } from "./lp-snapshot";
import { fetchMagicAddress } from "./magic";
export type MapOfLpCount = { [address: string]: number };



/**
 * Takes an array of liquidity across blocks
 * Returns a map of total liquidity for each address map across all blocks
 * @param liquidityAcrossBlocks
 * @returns mapOfLpCount
 */
export const makeLpPointsMap = (
  liquidityAcrossBlocks: MapOfLpCount[]
): MapOfLpCount => {
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
 * @returns mapOfLpCount
 */
export const updateTokensPerBlockReward = (
  userTokensPerEpoch: MapOfLpCount | Record<string, never>,
  liquidityAcrossBlocks: MapOfLpCount[],
  perBlockReward: number
): MapOfLpCount => {
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
 * @returns mapOfLpCount
 */
export const updateTokensPerEpochReward = (
  userTokensPerEpoch: MapOfLpCount | Record<string, never>,
  liquidityAcrossBlocks: MapOfLpCount[],
  supplyOfTokenForEpoch: number
): MapOfLpCount => {
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

// TODO - BREAK THESE OUT INTO CLEANERS

/**
 * Sums liquidity of a given block
 * @param block
 * @returns number
 */
export const sumValues = (block: MapOfLpCount): number => {
  const allLiquidity: number[] = Object.values(block);
  return allLiquidity.reduce((acc, current) => {
    return acc + current;
  }, 0);
};

export const addEoaToUserMap = async (map: {[userAddres:string]: number}) => {
  // Return an array with address, EOA and amount
  return Promise.all(
    Object.keys(map).map(async (userAddress) => {
      const magicWallet = await fetchMagicAddress(userAddress);
      return {
        proxyWallet: userAddress,
        amount: map[userAddress],
        magicWallet: magicWallet,
      };
    })
  );
}
