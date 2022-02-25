import { expect } from "chai";
import {
  cleanUserAmounts,
} from "../src/helpers";

describe("ban list", () => {
  let mockFees, alan, brian, carrie, devon, earl, banMap;

  beforeEach(() => {
    alan = "0x00D3BB55A6259416BB8DeF0EB46818aD178326eB".toLowerCase();
    brian = "0x0322c202691B2f1Eb4c4aB01Ee0813796392a3f2".toLowerCase();
    carrie = "0x0364E487CCd5a61d3c83848a420846848aE08061".toLowerCase();
    devon = "0x03d47623592049d5B402694E205AB12318d53a91".toLowerCase();
    earl = "0x04004b2A058F38df685dB22496c36dc4598F3F07".toLowerCase();

    mockFees = [
      { user: alan, amount: "1959999" },
      { user: brian, amount: "204" },
      { user: carrie, amount: "161130" },
      { user: devon, amount: "51912313" },
      { user: earl, amount: "200000000" },
    ];

    banMap = {
      [brian]: true,
    };
  });

  it("should not include someone from ban list", async () => {
    const expected = cleanUserAmounts(mockFees, banMap);

	const isBrianThere = expected.some(e => e.user === brian)
	expect(isBrianThere).to.equal(false)

	const isAlanThere = expected.some(e => e.user === alan)
	expect(isAlanThere).to.equal(true)
  });
});
