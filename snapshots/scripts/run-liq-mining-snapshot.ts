import * as dotenv from "dotenv";
import * as yargs from "yargs";
import fetch from "cross-fetch";
import { generateLpSnapshot } from "../src/lp-snapshot";
import * as fs from "fs";
import {
  normalizeEarningsFewFormat,
  combineMaps,
  formatClaimsForStrapi,
} from "../src/helpers";
import {
  parseBalanceMap,
  MerkleDistributorInfo,
  NewFormat,
} from "../../merkle-distributor/src/parse-balance-map";
import { generateFeesSnapshot } from "../src/fees-snapshot";
import { ReturnType, MapOfCount } from "../src/interfaces";
import {
  RewardEpochFromStrapi,
  ensureGoodDataFromStrapi,
  cleanEpochInfoFromStrapi,
} from "../src/lp-helpers";
import { BigNumber, ethers } from "ethers";
import { cleanNumber } from "../src/helpers";

const DEFAULT_FILE_PATH = `./snapshots/week`;

const DEFAULT_BLOCKS_PER_SAMPLE = 1800; // Approx every hour with a 2s block time
// const DEFAULT_BLOCKS_PER_SAMPLE = 30; // Approx every min with a 2s block time
// const DEFAULT_TOKENS_PER_SAMPLE = 60; // tokens_per_block * block_per_sample

dotenv.config();

const args = yargs.options({
  //   incentivizedMarkets: {
  //     type: "array",
  //     demandOption: false,
  //     default: [
  // old
  //   "0x04Cee4E1Bb67c02645C65094367e1DcF7b964e5a", // "will-the-floor-price-of-bored-apes-be-above-48-eth-on-december-22-2021"
  //   "0x06381008AdA763dbf3327391482Cf1f2DBE4AE0B", // "which-cryptocurrency-will-perform-better-in-december-2021-bitcoin-or-ethereum"
  //   "0x07A0De7adD49AC051582B25ee466a1E84CdC4552", // "will-clubhouse-officially-announce-theyve-been-acquired-in-2021"
  //   "0x15D28cd6635149481Dc4080692Bcb05d5e9fCA4c", // "will-the-polygon-matic-market-cap-be-above-15-billion-on-december-25"
  //   "0x1D8263132bb0dCfa97B4fa1dea53C32BDfE08cE3", // slug: 'will-the-fide-top-3-chess-players-be-carlsen-firouzja-ding-on-january-8'
  //
  //   {
  //     marketMaker: "0x3680bA7d7AE2f894F1703d654C8A0DDbbbDE8FFf",
  //     slug: "will-california-or-florida-have-a-higher-7-day-covid-19-case-average-on-christmas-eve",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 10000,
  //   },
  //   {
  //     marketMaker: "0x54A3d3F5E6637f680049cce587D5E0DdDE87f104",
  //     slug: "will-the-floor-price-of-cryptopunks-be-above-75-eth-on-december-23-2021",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 8000,
  //   },
  //   {
  //     marketMaker: "0x60C0E96f410b4cc5a0008E2B7c697EC36a8d4a5A",
  //     slug: "will-spider-man-no-way-home-get-90-or-higher-tomatometer-sco",
  //     howToCalculate: LpCalculation.PerBlock,
  //     amount: 4,
  //   },
  //   {
  //     marketMaker: "0x6474406F81b5C32D80eb1B3545b2B22a85B73AD3",
  //     slug: "will-uniswap-be-live-on-polygon-before-2022",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 9000,
  //   },
  //   {
  //     marketMaker: "0x8a2247860394D760bf867E64c639a4b27BbFBCDB",
  //     slug: "will-246-million-americans-have-received-at-least-one-dose-of-an-approved-covid-19-vaccination-by-january-1-2022",
  //     howToCalculate: LpCalculation.PerBlock,
  //     amount: 1,
  //   },
  //   {
  //     marketMaker: "0x932b2aC1799D4353d802Ddc27eb6DBC952e24b36",
  //     slug: "Will Ethereum reach $5000 by the end of ?",
  //     howToCalculate: LpCalculation.PerBlock,
  //     amount: 4,
  //   },
  //   {
  //     marketMaker: "0x934676348A1a036949B5D97a5b0870c629f8ebc5",
  //     slug: "will-chris-cuomo-launch-a-substack-before-january-10",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 6000,
  //   },
  //   {
  //     marketMaker: "0x97158238C176A5aFAfee18180F8527Aea906E8f7",
  //     slug: "which-film-will-gross-more-in-their-domestic-box-office-releases-dune-or-shang-chi",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 2000,
  //   },
  //   {
  //     marketMaker: "0x9E2d4470d3D599BB349d7457513dDD7379780dB0",
  //     slug: "will-the-omicron-variant-be-marked-as-a-variant-of-high-consequence-by-the-cdc-before-2022",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 12000,
  //   },
  //   {
  //     marketMaker: "0xBC12a7269EC807690793C86c81241eDCA8F2E3D0",
  //     slug: "Will Coinbase’s NFT marketplace launch before 2022?",
  //     howToCalculate: LpCalculation.PerBlock,
  //     amount: 4,
  //   },
  //   {
  //     marketMaker: "0xeAcfAAbE72C9a300df227B3d7cc63b8cC448138E",
  //     slug: "who-will-win-2021-chilean-presidential-elections",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 4600,
  //   },
  // new
  //   {
  //     marketMaker: "0xeAcfAAbE72C9a300df227B3d7cc63b8cC448138E",
  //     slug: "who-will-win-2021-chilean-presidential-elections",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 4000,
  //   },
  //   {
  //     marketMaker: "0xB7FA5978C926701e122548aeA39724C1dAF6F0eA",
  //     slug: "who-will-win-jake-paul-v-tyron-woodley",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 10000,
  //   },
  //   {
  //     marketMaker: "0x25F8b3910D21424035729e04d595Db21afD3361B",
  //     slug: "will-gavin-newsom-be-governor-of-california-on-december-31-2021",
  //     howToCalculate: LpCalculation.PerBlock,
  //     amount: 2,
  //   },
  //   {
  //     marketMaker: "0x87C05AaA91843eec2f2d3C8B227B3dCc9DF04184",
  //     slug: "will-spacexs-starship-successfully-reach-outer-space-by-december-31-2021",
  //     howToCalculate: LpCalculation.PerBlock,
  //     amount: 3,
  //   },
  //   {
  //     marketMaker: "0x1E388fD85eBa65182Ad9AE52A0eab094aF785eE1",
  //     slug: "will-hikaru-nakamura-win-the-2021-speed-chess-championship-main-event",
  //     howToCalculate: LpCalculation.PerMarket,
  //     amount: 8000,
  //   },
  //     ],
  //   },
  baseFilePath: {
    type: "string",
    demandOption: false,
    default: DEFAULT_FILE_PATH,
  },
  blocksPerSample: {
    type: "number",
    demandOption: false,
    default: DEFAULT_BLOCKS_PER_SAMPLE,
  },
  strapiUrl: {
    type: "string",
    demandOption: false,
    default: `http://localhost:1337`,
  },
  epoch: {
    type: "number",
    demandOption: false,
    default: 0, // increment here
  },
}).argv;

(async (args: any) => {
  const epochRes = await fetch(
    `${args.strapiUrl}/reward-epoches/${args.epoch}`
  );
  const epochInfo: RewardEpochFromStrapi = await epochRes.json();
  ensureGoodDataFromStrapi(epochInfo);
  if (epochInfo.epoch !== parseInt(args.epoch)) {
    throw new Error("Epochs do not match!");
  }
  const { startTimestamp, endTimestamp, markets, feeTokenSupply } =
    cleanEpochInfoFromStrapi(epochInfo);

  console.log("start Date", new Date(startTimestamp));
  console.log("end Date", new Date(endTimestamp));

  const t1 = Date.now();
  const liqMap = await generateLpSnapshot(
    ReturnType.Map,
    startTimestamp,
    endTimestamp,
    markets,
    args.blocksPerSample
  );
  console.log("liqMap", Object.keys(liqMap).length + " liquidity providers");
  const t2 = Date.now();
  const feeMap = await generateFeesSnapshot(
    ReturnType.Map,
    startTimestamp,
    endTimestamp,
    feeTokenSupply
  );
  console.log("feeMap", Object.keys(feeMap).length + " users who paid fees");
  const t3 = Date.now();
  const totalUserMap = combineMaps([
    liqMap as MapOfCount,
    feeMap as MapOfCount,
  ]);
  console.log(
    "totalUserMap",
    Object.keys(totalUserMap).length + " total users"
  );
  // todo - look at DistributorSdk.spec.ts for this...
  //   if (week > 0) {
  //   sdk = new MerkleDistributorSdk()
  //   sdk.freeze()
  //   get-previous-week-merkle-info-from-strapi-or-locally
  //   const previousClaims = await sdk.getClaimedStatus(previousMerkleInfo);
  //   const nextMerkleInfo = combineMerkleInfo(previousClaims, normalizedUserMap);
  //   await deployerSdk.updateMerkleRoot(nextMerkleInfo.merkleRoot);
  const normalizedEarnings = normalizeEarningsFewFormat(totalUserMap);
  //   console.log("normalizedEarnings", normalizedEarnings);
  const merkleInfo: MerkleDistributorInfo = parseBalanceMap(normalizedEarnings);
  //   console.log("merkleInfo", merkleInfo);
  console.log(
    "merkleInfo",
    Object.keys(merkleInfo.claims).length + " total claims"
  );
  console.log("liq diff", t2 - t1);
  console.log("fee diff", t3 - t2);
  const merkleRootFileName = `${args.baseFilePath}-${args.epoch}-merkle-info.json`;
  try {
    fs.writeFileSync(merkleRootFileName, JSON.stringify(merkleInfo));
  } catch (error) {
    console.log("write merkle snapshot", error);
  }
    const usersForStrapi = formatClaimsForStrapi(merkleInfo, args.epoch);
    try {
      await fetch(`${args.strapiUrl}/reward-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usersForStrapi),
      });
    } catch (error) {
      console.log("error", error);
    }
})(args);
