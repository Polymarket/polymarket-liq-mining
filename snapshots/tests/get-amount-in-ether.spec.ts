import { expect } from "chai";
import { formatEther } from "ethers/lib/utils";
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

    it("should handle USDC", async () => {
        const num = getAmountInEther(420, true);
        expect(num.toString()).to.eq("420000000");
    });

    it("should handle when decimals are longer than 18 decimal places", async () => {
        const numD = getAmountInEther(3022.0001000050069111111111111, false);
        expect(numD.toString()).to.eq("3022000100005007000000");
    });

    it("should handle positive scientific notation", async () => {
        const num = getAmountInEther(2.54e9, false);
        const formatted = formatEther(num.toString());
        expect(formatted).to.eq("2540000000.0");
    });

    it("should handle negative scientific notation", async () => {
        const num = getAmountInEther(2.2101698449851355e-8, false);
        const formatted = formatEther(num.toString());
        expect(formatted).to.eq("0.00000002210169845");
    });
});
