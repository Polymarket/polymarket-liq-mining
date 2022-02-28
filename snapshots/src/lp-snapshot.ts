import { calculateValOfLpPositionsAcrossBlocks } from "./fpmm";
import {
    getStartBlock,
    getEndBlock,
    convertTimestampToBlockNumber,
    getCurrentBlockNumber,
} from "./block_numbers";
import {
    calculateTokensPerSample,
    lowerCaseMarketMakers,
    LpMarketInfo,
    updateTokensPerBlockReward,
} from "./lp-helpers";
import { getStartAndEndBlock } from "./lp-helpers";
import { MapOfCount, ReturnSnapshot, ReturnType } from "./interfaces";
import { addEoaToUserPayoutMap } from "./helpers";

/**
 * Generate a lp weighted token snapshot
 * @param endTimestamp
 * @param supply
 * @returns
 */
export async function generateLpSnapshot(
  returnType: ReturnType,
  startTimestamp: number,
  endTimestamp: number,
  marketMakers: LpMarketInfo[],
  blocksPerSample: number
): Promise<ReturnSnapshot[] | MapOfCount> {
  console.log(`Generating lp snapshot with timestamp: ${endTimestamp}`);

  let userTokensPerEpoch: { [proxyWallet: string]: number } = {};
  const markets = lowerCaseMarketMakers(marketMakers);

  let epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
  while (!epochEndBlock) {
    console.log("epochEndBlock was not found. trying again!");
    epochEndBlock = await convertTimestampToBlockNumber(endTimestamp);
  }

  let epochStartBlock = await convertTimestampToBlockNumber(startTimestamp);
  while (!epochStartBlock) {
    console.log("epochStartBlock was not found. trying again!");
    epochStartBlock = await convertTimestampToBlockNumber(startTimestamp);
  }

  for (const market of markets) {
    const { marketMaker } = market;
    const marketStartBlock = await getStartBlock(marketMaker);
    const marketEndBlock = await getEndBlock(marketMaker);

    let rewardMarketEndBlock = null;

    if (market.rewardMarketEndDate) {
      console.log("reward market end date exists, getting block!");
      while (!rewardMarketEndBlock) {
        console.log("reward market end block was not found. trying again!");
        rewardMarketEndBlock = await convertTimestampToBlockNumber(
          market.rewardMarketEndDate
        );
      }
    }

    let rewardMarketStartBlock = null;
    if (market.rewardMarketStartDate) {
      console.log("reward market start date exists, getting block!");
      while (!rewardMarketStartBlock) {
        console.log("reward market end block was not found. trying again!");
        rewardMarketStartBlock = await convertTimestampToBlockNumber(
          market.rewardMarketEndDate
        );
      }
    }

    const { startBlock, endBlock: eb } = getStartAndEndBlock({
      epochStartBlock,
      epochEndBlock,
      marketStartBlock,
      marketEndBlock,
      rewardMarketEndBlock,
      rewardMarketStartBlock,
    });

    const currentBlock = await getCurrentBlockNumber();
    // if epoch has not ended and market has not resolved, get current block
    const endBlock = !eb ? currentBlock : eb;
    console.log({
      epochStartBlock,
      marketStartBlock,
      rewardMarketStartBlock,
      rewardMarketEndBlock,
      marketEndBlock,
      epochEndBlock,
      currentBlock,
      startBlockBeingUsed: startBlock,
      endBlockBeingUsed: endBlock,
    });

    //Ensure that the market occured within the blocks being checked
    if (startBlock !== null && endBlock > startBlock) {
      const samples: number[] = [];
      for (
        let block = startBlock;
        block <= endBlock;
        block += blocksPerSample
      ) {
        samples.push(block);
      }

      console.log(`Using ${market.howToCalculate} calculation`);

      const tokensPerSample = calculateTokensPerSample(
        market,
        samples.length,
        blocksPerSample
      );
      console.log(`Using ${tokensPerSample} tokens per sample`);
      console.log(
        `Using ${tokensPerSample / blocksPerSample} tokens per block`
      );

      console.log(
        `Diff between now and endBlock is ${
          currentBlock - endBlock
        } blocks. (43,200 = 1 day; 1,800 = 1 hour; 30 = 1 minute)`
      );

      // get liquidity state across many blocks for a market
      const liquidityAcrossBlocks = await calculateValOfLpPositionsAcrossBlocks(
        marketMaker,
        samples
      );

      userTokensPerEpoch = updateTokensPerBlockReward(
        userTokensPerEpoch,
        liquidityAcrossBlocks,
        tokensPerSample
      );
    }

    return addEoaToUserPayoutMap(userTokensPerEpoch);
}
