import {
  calculateTokensPerSample,
  IStartAndEndBlock,
  LpCalculation,
  updateTokensPerBlockReward,
} from "../src/lp-helpers";

import { expect } from "chai";
import { getStartAndEndBlock, LpMarketInfo } from "../src/lp-helpers";

describe("calculate samples correctly", () => {
  let markets: LpMarketInfo[];
  let blocksPerSample: number;
  let numSamplesInMarket: number;
  let alan, brian;

  beforeEach(() => {
    blocksPerSample = 30;
    numSamplesInMarket = 420;
    alan = "0x00D3BB55A6259416BB8DeF0EB46818aD178326eB";
    brian = "0x0322c202691B2f1Eb4c4aB01Ee0813796392a3f2";
    markets = [
      {
        marketMaker: alan,
        howToCalculate: LpCalculation.PerBlock,
        amount: 2,
      },
      {
        marketMaker: brian,
        howToCalculate: LpCalculation.PerMarket,
        amount: 20000,
      },
    ];
  });

  it("should calculate tokens per sample based off tokens per block", async () => {
    const tokensPerSample = calculateTokensPerSample(
      markets[0],
      420,
      blocksPerSample
    );
    expect(tokensPerSample).to.eq(markets[0].amount * blocksPerSample);
  });

  it("should calculate tokens per sample based off tokens per market", async () => {
    const tokensPerSample = calculateTokensPerSample(
      markets[1],
      numSamplesInMarket,
      blocksPerSample
    );
    expect(tokensPerSample).to.eq(markets[1].amount / numSamplesInMarket);
  });
});

describe("updateTokens on a PerBlockReward", () => {
  let initialState, alan, brian, carrie, devon, earl;

  beforeEach(() => {
    alan = "0x00D3BB55A6259416BB8DeF0EB46818aD178326eB";
    brian = "0x0322c202691B2f1Eb4c4aB01Ee0813796392a3f2";
    carrie = "0x0364E487CCd5a61d3c83848a420846848aE08061";
    devon = "0x03d47623592049d5B402694E205AB12318d53a91";
    earl = "0x04004b2A058F38df685dB22496c36dc4598F3F07";

    initialState = {
      [alan]: 0.0000361591034695245,
      [brian]: 106.91813466183105,
      [carrie]: 80.34668192769267,
      [devon]: 186.31548306498135,
      [earl]: 51023.12194929194422,
    };
  });

  it("should not erase existing state", async () => {
    const liquidity = [{ [alan]: 69 }];
    const newState = updateTokensPerBlockReward(initialState, liquidity, 1);
    expect(newState[devon]).to.eq(initialState[devon]);
  });

  it("should work with no initial state", async () => {
    const newAmount = 100;
    const liquidity = [{ [alan]: newAmount, [brian]: newAmount }];
    const newState = updateTokensPerBlockReward({}, liquidity, newAmount);
    expect(newState[alan]).to.eq(newAmount / 2);
    expect(newState[brian]).to.eq(newAmount / 2);
  });

  it("should work correctly with multiple blocks", async () => {
    const perBlockReward = 10;
    const perBlockLiquidity = 300;
    const aPercent = 0.75;
    const bPercent = 0.2;
    const ePercent = 0.05;
    const numOfBlocks = 3;
    const liquidity = [
      {
        [alan]: perBlockLiquidity * aPercent,
        [brian]: perBlockLiquidity * bPercent,
        [earl]: perBlockLiquidity * ePercent,
      },
      {
        [alan]: perBlockLiquidity * aPercent,
        [brian]: perBlockLiquidity * bPercent,
        [earl]: perBlockLiquidity * ePercent,
      },
      {
        [alan]: perBlockLiquidity * aPercent,
        [brian]: perBlockLiquidity * bPercent,
        [earl]: perBlockLiquidity * ePercent,
      },
    ];
    const newState = updateTokensPerBlockReward(
      initialState,
      liquidity,
      perBlockReward
    );
    expect(newState[alan]).to.eq(
      initialState[alan] + perBlockReward * aPercent * numOfBlocks
    );
    expect(newState[brian]).to.eq(
      initialState[brian] + perBlockReward * bPercent * numOfBlocks
    );
    expect(newState[earl]).to.eq(
      initialState[earl] + perBlockReward * ePercent * numOfBlocks
    );
  });
});

const mockState = {
  epochStartBlock: 21000000,
  marketStartBlock: 21400000,
  marketEndBlock: 21600000,
  epochEndBlock: 21900000,
};

// - if the END BLOCK is the END OF MARKET => TOTAL SUPPLY CALCULATION
// - if the END BLOCK is the END OF EPOCH => PER BLOCK CALCULATION

describe("calculate correct start and end blocks", () => {
  let initialState: IStartAndEndBlock = mockState;
  // 22291274
  beforeEach(() => {
    initialState = { ...mockState };
  });

  // STARTS
  it("if the epoch starts after the market, start block is epoch block", async () => {
    initialState.epochStartBlock = 21500000;
    const { startBlock } = getStartAndEndBlock(initialState);
    expect(startBlock).to.eq(initialState.epochStartBlock);
  });

  it("if the epoch starts before the market, start block is market block", async () => {
    const { startBlock } = getStartAndEndBlock(initialState);
    expect(startBlock).to.eq(initialState.marketStartBlock);
  });

  it("if the market started and the epoch has not started, start block is market", async () => {
    initialState.epochStartBlock = null;
    const { startBlock } = getStartAndEndBlock(initialState);
    expect(startBlock).to.eq(initialState.marketStartBlock);
  });

  // ERRORS

  it("if there are no start dates, it errors", async () => {
    initialState.epochStartBlock = null;
    initialState.marketStartBlock = null;
    expect(() => getStartAndEndBlock(initialState)).to.throw();
  });

  it("if there is no market start date, it errors", async () => {
    initialState.marketStartBlock = null;
    expect(() => getStartAndEndBlock(initialState)).to.throw();
  });

  // ENDS

  it("if the market ends before the epoch, end block is market block", async () => {
    const { endBlock } = getStartAndEndBlock(initialState);
    expect(endBlock).to.eq(initialState.marketEndBlock);
  });

  it("if the epoch ends before the market, end block is epoch block", async () => {
    initialState.epochEndBlock = 21500000;
    const { endBlock } = getStartAndEndBlock(initialState);
    expect(endBlock).to.eq(initialState.epochEndBlock);
  });

  it("if the market ends and the epoch has not ended, end block is market block", async () => {
    initialState.epochEndBlock = null;
    const { endBlock } = getStartAndEndBlock(initialState);
    expect(endBlock).to.eq(initialState.marketEndBlock);
  });

  it("if the epoch ends and the market has not resolved, end block is epoch block", async () => {
    initialState.marketEndBlock = null;
    const { endBlock } = getStartAndEndBlock(initialState);
    expect(endBlock).to.eq(initialState.epochEndBlock);
  });

  it("if the epoch has not ended and the market has not resolved, end block is null", async () => {
    initialState.epochEndBlock = null;
    initialState.marketEndBlock = null;
    const { endBlock } = getStartAndEndBlock(initialState);
    expect(endBlock).to.eq(null);
  });

  it("if the epoch ends and the market has not resolved, end block is epoch block", async () => {
    initialState.marketEndBlock = null;
    const { endBlock } = getStartAndEndBlock(initialState);
    expect(endBlock).to.eq(initialState.epochEndBlock);
  });
});
