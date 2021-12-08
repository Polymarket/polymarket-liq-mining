export type MapOfLpCount = { [address: string]: number };

/**
 * Sums liquidity of a given block
 * @param block
 * @returns number
 */
export const sumLiquidity = (block: MapOfLpCount): number => {
  const allLiquidity: number[] = Object.values(block);
  return allLiquidity.reduce((acc, current) => {
    return acc + current;
  }, 0);
};

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
      if (map[liquidityProvider] == null) {
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
 * According to a per block reward amount
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
  console.log("map", map);
  for (const liquidityAtBlock of liquidityAcrossBlocks) {
    console.log("liquidityAtBlock", liquidityAtBlock);
    const totalLiquidity = sumLiquidity(liquidityAtBlock);
    console.log("totalLiquidity", totalLiquidity);
    for (const liquidityProvider of Object.keys(liquidityAtBlock)) {
      if (!map[liquidityProvider]) {
        map[liquidityProvider] = 0;
      }

      const portionOfBlockReward =
        liquidityAtBlock[liquidityProvider] / totalLiquidity;
      console.log("portionOfBlockReward", portionOfBlockReward);

      const newAmount =
        map[liquidityProvider] + portionOfBlockReward * perBlockReward;
      console.log("newAmount", newAmount);

      map[liquidityProvider] = newAmount;
    }
  }
  return map;
};

export const updateTokensPerEpochReward = (
  userTokensPerEpoch: MapOfLpCount | Record<string, never>,
  liquidityAcrossBlocks: MapOfLpCount[],
  supplyOfTokenForEpoch: number
): MapOfLpCount => {
  const map = { ...userTokensPerEpoch };
  const marketLpPoints = makeLpPointsMap(liquidityAcrossBlocks);
  const totalLiquidityPoints = sumLiquidity(marketLpPoints);
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
