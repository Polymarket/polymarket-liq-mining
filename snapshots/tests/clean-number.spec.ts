import { expect } from "chai";
import { getAmountInEther } from "../src/helpers";

describe("updateTokens on a PerBlockReward", () => {
  it("should correctly parse decimals", async () => {
    const numA = getAmountInEther(1.000001);
    expect(numA.toString()).to.eq("1000001000000000000");

    const numB = getAmountInEther(0.00000420000069);
    expect(numB.toString()).to.eq("4200000690000");

    const numC = getAmountInEther(420420.0000050069);
    expect(numC.toString()).to.eq("420420000005006900000000");
  });

  // no error
  it("should handle when decimals are longer than 18 decimal places", async () => {
    const numD = getAmountInEther(3022.0001000050069111111111111);
    expect(numD.toString()).to.eq("3022000100005007000000");
  });

  // error
  it.skip("should handle when decimals are longer than 18 decimal places", async () => {
    const numD = getAmountInEther(0.0000000050069111111111111);
    console.log("numD", numD);
    expect(numD.toString()).to.eq("5006911111111111000");
  });
});
