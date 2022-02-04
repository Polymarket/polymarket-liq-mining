import { expect } from "chai";
import {
  cleanUserAmounts,
  makePointsMap,
  sumValues,
  makePayoutsMap,
} from "../src/helpers";

describe("updateTokens on a PerBlockReward", () => {
  let mockFees, alan, brian, carrie, devon, earl;

  beforeEach(() => {
    alan = "0x00D3BB55A6259416BB8DeF0EB46818aD178326eB";
    brian = "0x0322c202691B2f1Eb4c4aB01Ee0813796392a3f2";
    carrie = "0x0364E487CCd5a61d3c83848a420846848aE08061";
    devon = "0x03d47623592049d5B402694E205AB12318d53a91";
    earl = "0x04004b2A058F38df685dB22496c36dc4598F3F07";

    mockFees = [
      { user: alan, amount: "1959999" },
      { user: brian, amount: "204" },
      { user: carrie, amount: "161130" },
      { user: devon, amount: "51912313" },
      { user: earl, amount: "200000000" },
    ];
  });

  it("should turn string fees into number and divide by 10^6", async () => {
    const cleanedUserAmounts = cleanUserAmounts(mockFees);
    const expected0 = parseInt(mockFees[0].amount) / Math.pow(10, 6);
    const expected1 = parseInt(mockFees[1].amount) / Math.pow(10, 6);
    expect(cleanedUserAmounts[0].amount).to.eq(expected0);
    expect(cleanedUserAmounts[1].amount).to.eq(expected1);
  });

  it("should make a map", async () => {
    const cleanedUserAmounts = cleanUserAmounts(mockFees);
    const pointsMap = makePointsMap(cleanedUserAmounts);
    expect(pointsMap[cleanedUserAmounts[2].user]).to.eq(
      parseInt(mockFees[2].amount) / Math.pow(10, 6)
    );
  });

  it("should sum the map", async () => {
    const cleanedUserAmounts = cleanUserAmounts(mockFees);
    const pointsMap = makePointsMap(cleanedUserAmounts);
    const feeSum = sumValues(pointsMap);
    const expected = Object.values(pointsMap).reduce((a, c) => (a += c), 0);
    expect(feeSum).to.eq(expected);
  });

  it("should make payout map", async () => {
    const totalSupply = 100000;
    const cleanedUserAmounts = cleanUserAmounts(mockFees);
    const pointsMap = makePointsMap(cleanedUserAmounts);
    const feeSum = sumValues(pointsMap);
    const payoutMap = makePayoutsMap(pointsMap, feeSum, totalSupply);
    expect(payoutMap[alan]).to.eq((pointsMap[alan] / feeSum) * totalSupply);
    expect(payoutMap[carrie]).to.eq((pointsMap[carrie] / feeSum) * totalSupply);
    expect(payoutMap[earl]).to.eq((pointsMap[earl] / feeSum) * totalSupply);
  });
});
