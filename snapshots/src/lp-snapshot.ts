import { getAllMarkets } from "./markets";
import { calculateValOfLpPositionsAcrossBlocks } from "./fpmm";
import {
  getStartBlock,
  getEndBlock,
  convertTimestampToBlockNumber,
  getCurrentBlockNumber,
} from "./block_numbers";
import {
  updateTokensPerBlockReward,
  updateTokensPerEpochReward,
} from "./lp-helpers";
import { getStartAndEndBlock } from "./lp-helpers";
import { fetchMagicAddress } from "./magic";

export interface LpSnapshot {
  magicWallet: string | null;
  amount: number;
}

export interface ReturnSnapshot extends LpSnapshot {
  proxyWallet: string;
}

export enum LpCalculation {
  PerEpoch = "perEpoch",
  PerBlock = "perBlock",
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

  const epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
  const epochStartBlock = await convertTimestampToBlockNumber(startTimestamp);

  for (const market of markets) {
    const marketStartBlock = await getStartBlock(market);
    const marketEndBlock = await getEndBlock(market);

    const {
      howToCalculate,
      startBlock,
      endBlock: eb,
    } = getStartAndEndBlock({
      epochStartBlock,
      epochEndBlock,
      marketStartBlock,
      marketEndBlock,
    });

    const currentBlock = await getCurrentBlockNumber();
    // if epoch has not ended and market has not resolved, get current block?
    const endBlock = !eb ? currentBlock : eb;

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

      console.log(
        `Diff between now and endBlock is ${
          currentBlock - endBlock
        } blocks. (43,200 = 1 day; 1,800 = 1 hour; 30 = 1 minute)`
      );

      //   get liquidity state across many blocks for a market
      const liquidityAcrossBlocks = await calculateValOfLpPositionsAcrossBlocks(
        market,
        blocks
      );

      if (howToCalculate === LpCalculation.PerBlock) {
        console.log(
          `calculating liquidity per block with a per block reward of ${perBlockReward} tokens`
        );
        userTokensPerEpoch = updateTokensPerBlockReward(
          userTokensPerEpoch,
          liquidityAcrossBlocks,
          perBlockReward
        );
      }

      if (howToCalculate === LpCalculation.PerEpoch) {
        console.log(
          `calculating liquidity per epoch with a total supply of ${supplyOfTokenForEpoch} tokens`
        );
        userTokensPerEpoch = updateTokensPerEpochReward(
          userTokensPerEpoch,
          liquidityAcrossBlocks,
          supplyOfTokenForEpoch
        );
      }
    }

    // Return an array with address, EOA and amount
    return Promise.all(
      Object.keys(userTokensPerEpoch).map(async (liquidityProvider) => {
        const magicWallet = await fetchMagicAddress(liquidityProvider);
        return {
          proxyWallet: liquidityProvider,
          amount: userTokensPerEpoch[liquidityProvider],
          magicWallet: magicWallet,
        };
      })
    );
  }
}
