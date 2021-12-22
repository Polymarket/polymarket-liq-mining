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

  beforeEach(() => {
    blocksPerSample = 30;
    numSamplesInMarket = 420;
    markets = [
      {
        marketMaker: "0xa",
        slug: "hello",
        howToCalculate: LpCalculation.PerBlock,
        amount: 2,
      },
      {
        marketMaker: "0xb",
        slug: "world",
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
  let initialState;

  beforeEach(() => {
    initialState = {
      "0xa": 0.0000361591034695245,
      "0xb": 106.91813466183105,
      "0xc": 80.34668192769267,
      "0xd": 186.31548306498135,
      "0xe": 51023.12194929194422,
    };
  });

  it("should not erase existing state", async () => {
    const liquidity = [{ "0xa": 69 }];
    const newState = updateTokensPerBlockReward(initialState, liquidity, 1);
    expect(newState["0xb"]).to.eq(initialState["0xb"]);
  });

  it("should work with no initial state", async () => {
    const newAmount = 100;
    const liquidity = [{ "0xa": newAmount, "0xb": newAmount }];
    const newState = updateTokensPerBlockReward({}, liquidity, newAmount);
    expect(newState["0xa"]).to.eq(newAmount / 2);
    expect(newState["0xb"]).to.eq(newAmount / 2);
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
        "0xa": perBlockLiquidity * aPercent,
        "0xb": perBlockLiquidity * bPercent,
        "0xe": perBlockLiquidity * ePercent,
      },
      {
        "0xa": perBlockLiquidity * aPercent,
        "0xb": perBlockLiquidity * bPercent,
        "0xe": perBlockLiquidity * ePercent,
      },
      {
        "0xa": perBlockLiquidity * aPercent,
        "0xb": perBlockLiquidity * bPercent,
        "0xe": perBlockLiquidity * ePercent,
      },
    ];
    const newState = updateTokensPerBlockReward(
      initialState,
      liquidity,
      perBlockReward
    );
    expect(newState["0xa"]).to.eq(
      initialState["0xa"] + perBlockReward * aPercent * numOfBlocks
    );
    expect(newState["0xb"]).to.eq(
      initialState["0xb"] + perBlockReward * bPercent * numOfBlocks
    );
    expect(newState["0xe"]).to.eq(
      initialState["0xe"] + perBlockReward * ePercent * numOfBlocks
    );
  });
});

// describe("updateTokens on a PerEpochReward", () => {
//   let initialState;
//   beforeEach(() => {
//     initialState = {
//       "0xa": 0.0000361591034695245,
//       "0xb": 106.91813466183105,
//       "0xc": 80.34668192769267,
//       "0xd": 186.31548306498135,
//       "0xe": 51023.12194929194422,
//     };
//   });

//   it("should not erase existing values", async () => {
//     const liquidity = [{ "0xa": 420 }];
//     const newState = updateTokensPerEpochReward(initialState, liquidity, 200);
//     expect(newState["0xb"]).to.eq(initialState["0xb"]);
//   });

//   it("should work with no initial state", async () => {
//     const perEpochReward = 200;
//     const liquidity = [{ "0xa": 100 }];
//     const newState = updateTokensPerEpochReward({}, liquidity, perEpochReward);
//     expect(newState["0xa"]).to.eq(perEpochReward);
//   });

//   it("should work correctly with multiple blocks", async () => {
//     const perEpochReward = 2000;
//     const liquidity = [
//       {
//         "0xa": 10,
//         "0xb": 20,
//         "0xc": 50,
//       },
//       {
//         "0xa": 60,
//         "0xb": 20,
//         "0xc": 5,
//       },
//       {
//         "0xa": 60,
//         "0xb": 40,
//         "0xc": 100,
//       },
//     ];

//     const newState = updateTokensPerEpochReward(
//       initialState,
//       liquidity,
//       perEpochReward
//     );

// 	const aSum = liquidity[0]["0xa"] + liquidity[1]["0xa"] + liquidity[2]["0xa"]
// 	const bSum = liquidity[0]["0xb"] + liquidity[1]["0xb"] + liquidity[2]["0xb"]
// 	const cSum = liquidity[0]["0xc"] + liquidity[1]["0xc"] + liquidity[2]["0xc"]
// 	const total = aSum + bSum + cSum;

//     expect(newState["0xa"]).to.eq(
//       initialState["0xa"] + perEpochReward * (aSum/total)
//     );
//     expect(newState["0xb"]).to.eq(
//       initialState["0xb"] + perEpochReward * (bSum/total)
//     );
//     expect(newState["0xc"]).to.eq(
//       initialState["0xc"] + perEpochReward * (cSum/total)
//     );
//   });
// });

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
