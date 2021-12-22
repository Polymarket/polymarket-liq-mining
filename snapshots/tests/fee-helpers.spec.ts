import { expect } from "chai";
import {
  cleanUserAmounts,
  makePointsMap,
  sumValues,
  makePayoutsMap,
} from "../src/helpers";

describe("updateTokens on a PerBlockReward", () => {
  let mockFees;

  beforeEach(() => {
    mockFees = [
      { user: "0xa", amount: "1959999" },
      { user: "0xb", amount: "204" },
      { user: "0xc", amount: "161130" },
      { user: "0xd", amount: "51912313" },
      { user: "0xe", amount: "200000000" },
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
    expect(payoutMap["0xa"]).to.eq((pointsMap["0xa"] / feeSum) * totalSupply);
    expect(payoutMap["0xc"]).to.eq((pointsMap["0xc"] / feeSum) * totalSupply);
    expect(payoutMap["0xe"]).to.eq((pointsMap["0xe"] / feeSum) * totalSupply);
  });
});
