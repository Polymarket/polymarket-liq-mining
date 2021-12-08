import {
  IStartAndEndBlock,
  updateTokensPerBlockReward,
  updateTokensPerEpochReward,
} from "../src/lp-helpers";

import { expect } from "chai";
import { getStartAndEndBlock } from "../src/lp-helpers";

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

  it("should work correctly", async () => {
    const newAmount = 100;
    const liquidity = [{ "0xa": newAmount, "0xb": newAmount }];
    const newState = updateTokensPerBlockReward(
      initialState,
      liquidity,
      newAmount
    );
    expect(newState["0xa"]).to.eq(initialState["0xa"] + newAmount / 2);
    expect(newState["0xb"]).to.eq(initialState["0xb"] + newAmount / 2);
  });
});

describe("updateTokens on a PerEpochReward", () => {
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

  it("should not erase existing values", async () => {
    const liquidity = [{ "0xa": 420 }];
    const newState = updateTokensPerEpochReward(initialState, liquidity, 200);
    expect(newState["0xb"]).to.eq(initialState["0xb"]);
  });

  it("should work with no initial state", async () => {
    const perEpochReward = 200;
    const liquidity = [{ "0xa": 100 }];
    const newState = updateTokensPerEpochReward({}, liquidity, perEpochReward);
    expect(newState["0xa"]).to.eq(perEpochReward);
  });

  it("should work correctly", async () => {
    const perEpochReward = 100;
    const totalNewLiq = 200;
    const aPercent = 0.75;
    const bPercent = 0.15;
    const cPercent = 0.1;
    const liquidity = [
      {
        "0xa": totalNewLiq * aPercent,
        "0xb": totalNewLiq * bPercent,
        "0xc": totalNewLiq * cPercent,
      },
    ];
    const newState = updateTokensPerEpochReward(
      initialState,
      liquidity,
      perEpochReward
    );
    expect(newState["0xa"]).to.eq(
      initialState["0xa"] + perEpochReward * aPercent
    );
    expect(newState["0xb"]).to.eq(
      initialState["0xb"] + perEpochReward * bPercent
    );
    expect(newState["0xc"]).to.eq(
      initialState["0xc"] + perEpochReward * cPercent
    );
  });
});

const mockState = {
  epochStartBlock: 21000000,
  marketStartBlock: 21400000,
  marketEndBlock: 21600000,
  epochEndBlock: 21900000,
};

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
