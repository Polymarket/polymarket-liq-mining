import { expect } from "chai";
import { getAmountInEther } from "../src/helpers";
import { combineMerkleInfo } from "../src/helpers";

describe("combine merkle info", () => {
  let merkle0Claims,
    merkle1Claims,
    alan,
    alanAmount,
    brian,
    brianAmount,
    carrie,
    carrieAmount,
    devon,
    devonAmount,
    earl,
    earlAmount;

  beforeEach(() => {
    alan = "0x00D3BB55A6259416BB8DeF0EB46818aD178326eB";
    alanAmount = 1959999.4;
    brian = "0x0322c202691B2f1Eb4c4aB01Ee0813796392a3f2";
    brianAmount = 204;

    carrie = "0x0364E487CCd5a61d3c83848a420846848aE08061";
    carrieAmount = 0.161130111;
    devon = "0x03d47623592049d5B402694E205AB12318d53a91";
    devonAmount = 5191.2313;
    earl = "0x04004b2A058F38df685dB22496c36dc4598F3F07";
    earlAmount = 200.0;

    merkle0Claims = [
      {
        index: 0,
        amount: getAmountInEther(alanAmount, false).toHexString(),
        proof: [],
        isClaimed: false,
        address: alan,
      },
      {
        index: 1,
        amount: getAmountInEther(brianAmount, false).toHexString(),
        proof: [],
        isClaimed: true,
        address: brian,
      },
      {
        index: 2,
        amount: getAmountInEther(devonAmount, false).toHexString(),
        proof: [],
        isClaimed: false,
        address: devon,
      },
    ];

    merkle1Claims = {
      [alan]: alanAmount,
      [brian]: brianAmount,
      [carrie]: carrieAmount,
      [devon]: devonAmount,
      [earl]: earlAmount,
    };
  });

  it("should not fail", async () => {
    try {
      combineMerkleInfo(merkle0Claims, merkle1Claims, false);
    } catch (error) {
      expect(2).to.eq(4);
    }
  });

  it("should not fail when the address has changed casing", async () => {
    const randomlyCasedMerkle0Claims = merkle0Claims.map((c, i) => ({
      ...c,
      address: i % 2 === 0 ? c.address.toUpperCase() : c.address.toLowerCase(),
    }));

    const randomlyCasedMerkle1Claims = Object.keys(merkle1Claims).reduce(
      (acc, key, idx) => {
        const amount = merkle1Claims[key];
        const address = idx % 2 === 0 ? key.toLowerCase() : key.toUpperCase();
        if (!acc[address]) {
          acc[address] = amount;
        }
        return acc;
      },
      {}
    );

    const result = combineMerkleInfo(randomlyCasedMerkle0Claims, randomlyCasedMerkle1Claims, false);

    expect(result.claims[alan].amount).to.eq(
      getAmountInEther(alanAmount * 2, false).toHexString()
    );

    expect(result.claims[brian].amount).to.eq(
      getAmountInEther(brianAmount, false).toHexString()
    );

    expect(result.claims[devon].amount).to.eq(
      getAmountInEther(devonAmount * 2, false).toHexString()
    );

    expect(result.claims[earl].amount).to.eq(
      getAmountInEther(earlAmount, false).toHexString()
    );
  });
});
