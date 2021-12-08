import { updateTokensPerBlockReward } from "../src/lp-helpers";

import { expect } from "chai";

describe("updateTokens on a PerBlockReward", () => {
  it("should not erase existing values", async () => {
    const existingState = {
      "0xa": 0.0000361591034695245,
      "0xb": 106.91813466183105,
      "0xc": 80.34668192769267,
      "0xd": 186.31548306498135,
      "0xe": 51023.12194929194422,
    };

	const newAmount = 100
    const liquidity = [{ "0xa": newAmount, "0xb": newAmount }];
    const newState = updateTokensPerBlockReward(existingState, liquidity, newAmount);
    expect(newState["0xa"]).to.eq(existingState["0xa"] + newAmount/2);
    expect(newState["0xb"]).to.eq(existingState["0xb"] + newAmount/2);
  });
});
