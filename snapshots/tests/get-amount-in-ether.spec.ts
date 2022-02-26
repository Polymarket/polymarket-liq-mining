import { expect } from "chai";
import { getAmountInEther } from "../src/helpers";

describe("updateTokens on a PerBlockReward", () => {
  it("should correctly parse decimals", async () => {
    const numA = getAmountInEther(1.000001, false);
    expect(numA.toString()).to.eq("1000001000000000000");

    const numB = getAmountInEther(0.00000420000069, false);
    expect(numB.toString()).to.eq("4200000690000");

    const numC = getAmountInEther(420420.0000050069, false);
    expect(numC.toString()).to.eq("420420000005006900000000");

  });

  it('should handle USDC', async () => {
    const num = getAmountInEther(420, true);
    expect(num.toString()).to.eq("420000000");
  })

  it("should handle when decimals are longer than 18 decimal places", async () => {
    const numD = getAmountInEther(3022.0001000050069111111111111, false);
    expect(numD.toString()).to.eq("3022000100005007000000");
  });
});
