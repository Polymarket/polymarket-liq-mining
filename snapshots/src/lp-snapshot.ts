import { getAllMarkets } from "./markets";
import { fetchMagicAddress } from "./magic";
import { calculateValOfLpPositionsAcrossBlocks } from "./fpmm";
import {
  getStartBlock,
  getEndBlock,
  convertTimestampToBlockNumber,
} from "./block_numbers";
import { getProvider } from "./provider";

/**
 * Generate a lp weighted token snapshot
 * @param endTimestamp
 * @param supply
 * @returns
 */
export async function generateLpSnapshot(
  endTimestamp: number,
  supply: number,
  blockSampleSize: number,
  map: {[key: string]: boolean},
  startTimestamp: number,
): Promise<any> {
  console.log(
    `Generating lp weighted snapshot with timestamp: ${endTimestamp} and token total supply: ${supply}...`
  );

  const snapshot: {
    proxyWallet: string;
    magicWallet: string;
    amount: number;
  }[] = [];
  const lpPointsCache = {};

  // get all markets pre snapshot
  const allMarkets: string[] = await getAllMarkets(endTimestamp);
  // only care about incentivized markets
  const markets = allMarkets.filter(m =>  map[m.toLowerCase()] )

//   console.log('endTimestamp', endTimestamp)
//   console.log('startTimestamp', startTimestamp)
  const epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
//   console.log(' epochEndBlock', epochEndBlock)
  const epochStartBlock = await convertTimestampToBlockNumber(startTimestamp)
//   console.log(' epochStartBlock', epochStartBlock)

  for (const market of markets) {
    const marketStartBlock = await getStartBlock(market);
	// console.log('marketStartBlock', marketStartBlock)
    let marketEndBlock = await getEndBlock(market);
	// console.log('marketEndBlock before', marketEndBlock)

	if (!marketEndBlock) {
		const provider = getProvider();
        //get current block number
        const currentBlockNumber = await provider.getBlockNumber();
		// get current block in case market has not ended and epoch end is in the future
		marketEndBlock = currentBlockNumber
	}
	// console.log('marketEndBlock after', marketEndBlock)

	// only count blocks in epoch, or start counting when the market starts
	const startBlock = epochStartBlock >= marketStartBlock ? epochStartBlock : marketStartBlock
	// console.log('startBlock', startBlock)
	// only count blocks in epoch, or count blocks til the market ended 
	const endBlock = epochEndBlock <= marketEndBlock ? epochEndBlock : marketEndBlock;
	// console.log('endBlock', endBlock)

    //Ensure that the market occured within the blocks being checked
    if (startBlock !== null && endBlock > startBlock) {
      const blocks: number[] = [];
      for (
        let block = startBlock;
        block <= endBlock;
        block += blockSampleSize
      ) {
        blocks.push(block);
      }

console.log('blocks', blocks)

      //get liquidity state across many blocks for a market
      const liquidityAcrossBlocks = await calculateValOfLpPositionsAcrossBlocks(
        market,
        blocks
      );

	  // todo - not 100% sure how we are going to calculate this yet...
	  console.log('liquidityAcrossBlocks', liquidityAcrossBlocks)

      for (const liquidityAtBlock of liquidityAcrossBlocks) {
        for (const liquidityProvider of Object.keys(liquidityAtBlock)) {
          if (lpPointsCache[liquidityProvider] == null) {
            lpPointsCache[liquidityProvider] = 0;
          }
          lpPointsCache[liquidityProvider] =
            lpPointsCache[liquidityProvider] +
            liquidityAtBlock[liquidityProvider];
        }
      }
    }
  }

  //get total liquidity points
  const allLiquidity: number[] = Object.values(lpPointsCache);
  const totalLiquidityPoints = allLiquidity.reduce(function (prev, current) {
    return prev + current;
  }, 0);

  //Populate snapshot
  for (const liquidityProvider of Object.keys(lpPointsCache)) {
    const liquidityPointsPerLp = lpPointsCache[liquidityProvider];
    const airdropAmount =
      (liquidityPointsPerLp / totalLiquidityPoints) * supply;
    const magicAddress = await fetchMagicAddress(liquidityProvider);

    snapshot.push({
      proxyWallet: liquidityProvider,
      magicWallet: magicAddress,
      amount: airdropAmount,
    });
  }
  return snapshot;
}
