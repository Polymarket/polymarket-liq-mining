import { expect } from "chai";
import { cleanAndSeparateEpochPerToken } from "../src/lp-helpers";
import { BigNumber } from "ethers";

describe("clean and separate epoch per token", () => {
  let mockEpochInfo, token1, token2, token3;

  beforeEach(() => {
    token1 = "USDC";
    token2 = "UMA";
    token3 = "LOL";

    mockEpochInfo = {
      id: 2,
      start: "2021-12-20T19:00:00.000Z",
      end: "2021-12-22T19:00:00.000Z",
      epoch: 0,
      reward_tokens: [
        {
          id: 1,
          reward_token: {
            id: 1,
            symbol: token1,
            name: token1,
            icon: {
              id: 1,
            },
          },
          fees_token_supply: "100000",
        },
        {
          id: 2,
          reward_token: {
            id: 2,
            symbol: token2,
            name: token2,
            icon: {
              id: 1,
            },
          },
          fees_token_supply: "50000",
        },
      ],
      reward_markets: [
        {
          id: 3,
          reward_epoch: 2,
          market: {
            marketMakerAddress: "0x0000000000000000000000000000000000000000",
          },
          published_at: "2022-01-26T21:34:48.827Z",
          created_at: "2021-12-27T22:26:40.752Z",
          updated_at: "2022-01-26T21:34:48.885Z",
          reward_tokens_liquidity: [
            {
              id: 1,
              reward_token: {
                id: 1,
                symbol: token1,
                name: token1,
              },
              token_calculation: "perBlock",
              lp_token_supply: "2",
            },
            {
              id: 2,
              reward_token: {
                id: 2,
                symbol: token2,
                name: token2,
              },
              token_calculation: "perMarket",
              lp_token_supply: "10000",
            },
          ],
        },
      ],
    };
  });
  it("should work", () => {
    const x = cleanAndSeparateEpochPerToken(mockEpochInfo);
    expect(x.tokenMap[token1].feeTokenSupply).to.eq(
      BigNumber.from("100000").toNumber()
    );
    expect(x.tokenMap[token2].feeTokenSupply).to.eq(
      BigNumber.from("50000").toNumber()
    );
  });

  it("should not fail if only adding an extra token for fees", () => {
    const thirdToken = {
      id: 3,
      reward_token: {
        id: 3,
        symbol: token3,
        name: token3,
        icon: {
          id: 1,
        },
      },
      fees_token_supply: "500000",
    };

    mockEpochInfo.reward_tokens.push(thirdToken);

    const expected = cleanAndSeparateEpochPerToken(mockEpochInfo);
    expect(expected.tokenMap[token3].markets.length).to.eq(0);
    expect(expected.tokenMap[token3].feeTokenSupply).to.eq(
      BigNumber.from("500000").toNumber()
    );
  });

  it("should not fail if only adding an extra liq token to an existing market", () => {
    const thirdSupply = "110000";

    const thirdLiq = {
      id: 3,
      reward_token: {
        id: 3,
        symbol: token3,
        name: token3,
      },
      token_calculation: "perMarket",
      lp_token_supply: thirdSupply,
    };

    mockEpochInfo.reward_markets[0].reward_tokens_liquidity.push(thirdLiq);

    const expected = cleanAndSeparateEpochPerToken(mockEpochInfo);
    expect(expected.tokenMap[token3].markets.length).to.eq(1);
    expect(expected.tokenMap[token3].feeTokenSupply).to.eq(0);
  });

  it("should not fail if only adding an extra liq token to an existing market", () => {
    const thirdSupply = "110000";

    const thirdMarket = {
      id: 4,
      reward_epoch: 2,
      market: {
        marketMakerAddress: "0x1000000000000000000000000000000000000000",
      },
      reward_tokens_liquidity: [
        {
          id: 3,
          reward_token: {
            id: 3,
            symbol: token3,
            name: token3,
          },
          token_calculation: "perMarket",
          lp_token_supply: thirdSupply,
        },
      ],
    };

    mockEpochInfo.reward_markets.push(thirdMarket);

    const expected = cleanAndSeparateEpochPerToken(mockEpochInfo);
    expect(expected.tokenMap[token3].markets.length).to.eq(1);
    expect(expected.tokenMap[token3].markets[0].amount).to.eq(BigNumber.from(thirdSupply).toNumber());
    expect(expected.tokenMap[token3].feeTokenSupply).to.eq(0);
  });
});
