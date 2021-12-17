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
import { MapOfCount, ReturnSnapshot, ReturnType } from "./interfaces";
import { addEoaToUserPayoutMap } from "./helpers";

export enum LpCalculation {
  TotalSupply = "totalSupply",
  PerBlock = "perBlock",
}

/**
 * Generate a lp weighted token snapshot
 * @param endTimestamp
 * @param supply
 * @returns
 */
export async function generateLpSnapshot(
  returnType: ReturnType,
  endTimestamp: number,
  tokensPerEpoch: number,
  blocksPerSample: number,
  marketMakers: string[],
  startTimestamp: number,
  tokensPerSample: number
): Promise<ReturnSnapshot[] | MapOfCount> {
  console.log(`Generating lp snapshot with timestamp: ${endTimestamp}`);

  let userTokensPerEpoch: { [proxyWallet: string]: number } = {};
  const markets = marketMakers.map(addr => addr.toLowerCase())

  const epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
  const epochStartBlock = await convertTimestampToBlockNumber(startTimestamp);

  for (const marketMakerAddress of markets) {
    const marketStartBlock = await getStartBlock(marketMakerAddress);
    const marketEndBlock = await getEndBlock(marketMakerAddress);
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
        block += blocksPerSample
      ) {
        blocks.push(block);
      }

      console.log(
        `Diff between now and endBlock is ${
          currentBlock - endBlock
        } blocks. (43,200 = 1 day; 1,800 = 1 hour; 30 = 1 minute)`
      );

      // get liquidity state across many blocks for a market
      const liquidityAcrossBlocks = await calculateValOfLpPositionsAcrossBlocks(
        marketMakerAddress,
        blocks
      );

      if (howToCalculate === LpCalculation.PerBlock) {
        console.log(
          `Calculating liquidity per block with a per block reward of ${
            tokensPerSample / blocksPerSample
          } tokens`
        );
        userTokensPerEpoch = updateTokensPerBlockReward(
          userTokensPerEpoch,
          liquidityAcrossBlocks,
          tokensPerSample
        );
      }

      if (howToCalculate === LpCalculation.TotalSupply) {
        console.log(
          `Calculating liquidity per epoch with a total supply of ${tokensPerEpoch} tokens`
        );
        userTokensPerEpoch = updateTokensPerEpochReward(
          userTokensPerEpoch,
          liquidityAcrossBlocks,
          tokensPerEpoch
        );
      }
    }
  }
  if (returnType === ReturnType.Map) {
    return userTokensPerEpoch;
  }

  return addEoaToUserPayoutMap(userTokensPerEpoch);
}
