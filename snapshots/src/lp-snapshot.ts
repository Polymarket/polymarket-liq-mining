import { getAllMarkets } from "./markets";
// import { fetchMagicAddress } from "./magic";
import { calculateValOfLpPositionsAcrossBlocks } from "./fpmm";
import {
  getStartBlock,
  getEndBlock,
  convertTimestampToBlockNumber,
  getCurrentBlockNumber,
} from "./block_numbers";
// import { getProvider } from "./provider";
import {
//   sumLiquidity,
//   makeLpMap,
//   makeLpPointsMap,
  updateTokensPerBlockReward,
  updateTokensPerEpochReward,
} from "./lp-helpers";
// import { getCurrentBlock } from "./block_numbers";

export interface LpSnapshot {
  magicWallet: string | null;
  amount: number;
}

export interface ReturnSnapshot extends LpSnapshot {
  proxyWallet: string;
}

enum LpCalculation {
  MarketEnd = "marketEnd",
  EpochEnd = "epochEnd",
}

/**
 * Generate a lp weighted token snapshot
 * @param endTimestamp
 * @param supply
 * @returns
 */
export async function generateLpSnapshot(
  endTimestamp: number,
  supplyOfTokenForEpoch: number,
  blockSampleSize: number,
  map: { [key: string]: boolean },
  startTimestamp: number,
  perBlockReward: number
): Promise<ReturnSnapshot[]> {
  console.log(`Generating lp snapshot with timestamp: ${endTimestamp}`);

  let userTokensPerEpoch: { [proxyWallet: string]: number } = {};
  // get all markets pre snapshot
  const allMarkets: string[] = await getAllMarkets(endTimestamp);
  // only care about incentivized markets
  const markets = allMarkets.filter((m) => map[m.toLowerCase()]);

  //   console.log('endTimestamp', endTimestamp)
  //   console.log('startTimestamp', startTimestamp)
  const epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
  //   console.log(' epochEndBlock', epochEndBlock)
  const epochStartBlock = await convertTimestampToBlockNumber(startTimestamp);
  //   console.log(' epochStartBlock', epochStartBlock)

  for (const market of markets) {
    const marketStartBlock = await getStartBlock(market);
    // console.log('marketStartBlock', marketStartBlock)
    const marketEndBlock = await getEndBlock(market);
    // console.log('marketEndBlock before', marketEndBlock)

    // console.log('marketEndBlock after', marketEndBlock)

    // only count blocks in epoch, or start counting when the market starts
    const startBlock =
      epochStartBlock >= marketStartBlock ? epochStartBlock : marketStartBlock;
    // console.log('startBlock', startBlock)

    // only count blocks in epoch, or count blocks til the market ended
    // const endBlock = epochEndBlock <= marketEndBlock ? epochEndBlock : marketEndBlock;
    let endBlock;
    let howToCalculate: LpCalculation;

    if (epochEndBlock <= marketEndBlock) {
      endBlock = epochEndBlock;
      howToCalculate = LpCalculation.EpochEnd;
      console.log("endBlock is epoch end block!");
      // todo - give LP's X amount per block
    } else {
      if (!marketEndBlock) {
        // get current block in case market has not ended and epoch end is in the future
        endBlock = await getCurrentBlockNumber();
        console.log("endBlock is current block!");
      } else {
        endBlock = marketEndBlock;
        console.log("endBlock is market end block!");
      }
      howToCalculate = LpCalculation.MarketEnd;
    }

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
      console.log("endBlock", endBlock);
      console.log(
        "END OF EPOCH BLOCK NUMBER IS IN BLOCKS",
        blocks.includes(endBlock)
      );

      //get liquidity state across many blocks for a market
      const liquidityAcrossBlocks = await calculateValOfLpPositionsAcrossBlocks(
        market,
        blocks
      );

      if (howToCalculate === LpCalculation.EpochEnd) {
        userTokensPerEpoch = updateTokensPerBlockReward(
          userTokensPerEpoch,
          liquidityAcrossBlocks,
          perBlockReward
        );
        console.log("in perBlock");
      }

      if (howToCalculate === LpCalculation.MarketEnd) {
        userTokensPerEpoch = updateTokensPerEpochReward(
          userTokensPerEpoch,
          liquidityAcrossBlocks,
          supplyOfTokenForEpoch
        );
        console.log("in supplyDivBlocks");
      }
    }

    // todo - map this and add magicWallet
    // const magicWallet = await fetchMagicAddress(liquidityProvider);

    // return Object.keys(userTokensPerEpoch).map((liquidityProvider) => {
    //   // console.log('liquidityProvider', liquidityProvider)
    //   // console.log('userTokensPerEpoch[liquidityProvider]', userTokensPerEpoch[liquidityProvider])
    //   return {
    //     proxyWallet: liquidityProvider,
    //     amount: userTokensPerEpoch[liquidityProvider].amount,
    //     magicWallet: userTokensPerEpoch[liquidityProvider].magicWallet,
    //   };
    // });
  }
}
