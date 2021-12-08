import {
  updateTokensPerBlockReward,
  updateTokensPerEpochReward,
} from "../src/lp-helpers";

import { expect } from "chai";

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

// todo - test block logic
