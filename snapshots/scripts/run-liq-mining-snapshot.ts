import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { generateLpSnapshot } from "../src/lp-snapshot";
import * as fs from "fs";
import {
  ONE_DAY_AGO,
  normalizeMapAmounts,
  addEoaToUserPayoutMap,
  normalizeEarningsFewFormat,
  EIGHT_DAYS_AGO,
} from "../src/helpers";
import {
  parseBalanceMap,
  MerkleDistributorInfo,
} from "../../merkle-distributor/src/parse-balance-map";
import {
  combineMaps,
  createStringMap,
  //   addEoaToUserPayoutMap,
  //   TWO_DAYS_AGO,
} from "../src/helpers";
import { generateFeesSnapshot } from "../src/fees-snapshot";
import { ReturnType, MapOfCount } from "../src/interfaces";
// import { updateMagicCacheFromSnapshot } from "../src/magic";
// import { writeSnapshot } from "../src/utils";
// import { FOUR_DAYS_AGO } from "../src/helpers";

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_FILE_PATH = `./snapshots/week`;
// const DEFAULT_BLOCK_SAMPLE = 1800; // Approx every hour with a 2s block time

const DEFAULT_BLOCK_SAMPLE = 30; // Approx every min with a 2s block time
const DEFAULT_PER_BLOCK_TOKEN_SUPPLY = 60; // divide supply / sample to get per block amount

// const DEFAULT_BLOCK_SAMPLE = 1; // Every block
// const DEFAULT_PER_BLOCK_TOKEN_SUPPLY = 2; // divide supply / sample to get per block amount

dotenv.config();

const args = yargs.options({
  endTimestamp: {
    type: "number",
    demandOption: false,
    default: ONE_DAY_AGO,
  },
  startTimestamp: {
    type: "number",
    demandOption: false,
    // default: TWO_DAYS_AGO,
    // default: FOUR_DAYS_AGO,
    default: EIGHT_DAYS_AGO,
  },
  feePerBlock: { type: "number", demandOption: false, default: 1 },
  baseFilePath: {
    type: "string",
    demandOption: false,
    default: DEFAULT_FILE_PATH,
  },
  incentivizedMarketMakerAddresses: {
    type: "array",
    demandOption: false,
    default: [
      //   "0x476238B6Ef1B0f065E97cffA22277cc2788852B7", // closed! "will-there-be-nfl-scorigami-in-december-2021",
      //   "0x1e6C49e7E776E6F76d31E6D6FCb5dD367F7B59dD", // nfl-will-the-bills-beat-the-patriots-by-more-than-4pt5-points-in-their-d
      //   "0x0E43f495B179953c6504dB44157dB296D8283554", // closed! - nba-will-the-mavericks-beat-the-city-thunder-by-more-than-4pt5-points-in-their-december-12
      //   "0x12675B90279dFa6883E087335bbDC4c1C9DBf388", // closed! - ufc-269-who-will-win-kai-kara-france-or-cody-garbrandt
      // // old
      "0x04Cee4E1Bb67c02645C65094367e1DcF7b964e5a", // "will-the-floor-price-of-bored-apes-be-above-48-eth-on-december-22-2021"
      "0x06381008AdA763dbf3327391482Cf1f2DBE4AE0B", // "which-cryptocurrency-will-perform-better-in-december-2021-bitcoin-or-ethereum"
      "0x07A0De7adD49AC051582B25ee466a1E84CdC4552", // "will-clubhouse-officially-announce-theyve-been-acquired-in-2021"
      "0x15D28cd6635149481Dc4080692Bcb05d5e9fCA4c", // "will-the-polygon-matic-market-cap-be-above-15-billion-on-december-25"
      "0x1D8263132bb0dCfa97B4fa1dea53C32BDfE08cE3", // slug: 'will-the-fide-top-3-chess-players-be-carlsen-firouzja-ding-on-january-8'
      //
      "0x3680bA7d7AE2f894F1703d654C8A0DDbbbDE8FFf", // "will-california-or-florida-have-a-higher-7-day-covid-19-case-average-on-christmas-eve"
      "0x54A3d3F5E6637f680049cce587D5E0DdDE87f104", // 'will-the-floor-price-of-cryptopunks-be-above-75-eth-on-december-23-2021', marketMakerAddress:
      "0x60C0E96f410b4cc5a0008E2B7c697EC36a8d4a5A", // 'will-spider-man-no-way-home-get-90-or-higher-tomatometer-sco', marketMakerAddress:
      "0x6474406F81b5C32D80eb1B3545b2B22a85B73AD3", //  "will-uniswap-be-live-on-polygon-before-2022",
      "0x8a2247860394D760bf867E64c639a4b27BbFBCDB", // "will-246-million-americans-have-received-at-least-one-dose-of-an-approved-covid-19-vaccination-by-january-1-2022"
      //
      "0x932b2aC1799D4353d802Ddc27eb6DBC952e24b36", // Will Ethereum reach $5000 by the end of ?"
      "0x934676348A1a036949B5D97a5b0870c629f8ebc5", //  'will-chris-cuomo-launch-a-substack-before-january-10'
      "0x97158238C176A5aFAfee18180F8527Aea906E8f7", // 'which-film-will-gross-more-in-their-domestic-box-office-releases-dune-or-shang-chi'
      "0x9E2d4470d3D599BB349d7457513dDD7379780dB0", // "will-the-omicron-variant-be-marked-as-a-variant-of-high-consequence-by-the-cdc-before-2022",
      "0xBC12a7269EC807690793C86c81241eDCA8F2E3D0", // Will Coinbase’s NFT marketplace launch before 2022?
      "0xeAcfAAbE72C9a300df227B3d7cc63b8cC448138E", // 'who-will-win-2021-chilean-presidential-elections',
      // new
      "0xB7FA5978C926701e122548aeA39724C1dAF6F0eA", // 'who-will-win-jake-paul-v-tyron-woodley'
      "0x25F8b3910D21424035729e04d595Db21afD3361B", // 'will-gavin-newsom-be-governor-of-california-on-december-31-2021'
      "0x87C05AaA91843eec2f2d3C8B227B3dCc9DF04184", // 'will-spacexs-starship-successfully-reach-outer-space-by-december-31-2021'
      "0x1E388fD85eBa65182Ad9AE52A0eab094aF785eE1", // 'will-hikaru-nakamura-win-the-2021-speed-chess-championship-main-event'
    ],
  },
  supply: {
    type: "string",
    demandOption: false,
    default: DEFAULT_TOKEN_SUPPLY,
  },
  blockSampleSize: {
    type: "number",
    demandOption: false,
    default: DEFAULT_BLOCK_SAMPLE,
  },
  perBlockReward: {
    type: "number",
    demandOption: false,
    default: DEFAULT_PER_BLOCK_TOKEN_SUPPLY,
  },
}).argv;

(async (args: any) => {
  // todo
  // fetchFromStrapi(week)
  // returns all market maker addresses ids, timestamps, supply
  const WEEK_NUMBER = 1;
  //   const now = Date.now();
  const endTimestamp = args.endTimestamp;
  const startTimestamp = args.startTimestamp;
  const supply = args.supply;
  const blockSampleSize = args.blockSampleSize;
  const perBlockReward = args.perBlockReward;
  const baseFilePath = args.baseFilePath;

  const incentivizedMarketsMap = createStringMap(
    args.incentivizedMarketMakerAddresses.map((addr) => addr.toLowerCase())
  );
  //   console.log("incentivizedMarketsMap", incentivizedMarketsMap);

  const t1 = Date.now();
  const liqMap = await generateLpSnapshot(
    ReturnType.Map,
    endTimestamp,
    supply,
    blockSampleSize,
    incentivizedMarketsMap,
    startTimestamp,
    perBlockReward
  );
  console.log("liqMap", Object.keys(liqMap).length + " liquidity providers");
  const t2 = Date.now();

  const feeMap = await generateFeesSnapshot(
    ReturnType.Map,
    startTimestamp,
    endTimestamp,
    supply
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

  //   const normalizedUserMap = normalizeMapAmounts(totalUserMap);

  // todo - we need to figure out if it's using our proxy (magic, metamask)
  // or if they're interacting directly with the contract
  // then add the correct payout address

  // const snapshot = await addEoaToUserPayoutMap(normalizedUserMap);
  //   updateMagicCacheFromSnapshot(snapshot);
  //   const t4 = Date.now();

  // todo - look at DistributorSdk.spec.ts for this...
  // if (week > 0) {
  // sdk = new MerkleDistributorSdk()
  // sdk.freeze()
  // get-previous-week-merkle-info-from-strapi-or-locally
  // const previousClaims = await sdk.getClaimedStatus(previousMerkleInfo);
  // const nextMerkleInfo = combineMerkleInfo(previousClaims, normalizedUserMap);
  // await deployerSdk.updateMerkleRoot(nextMerkleInfo.merkleRoot);

  const normalizedEarnings = normalizeEarningsFewFormat(totalUserMap);
  const merkleInfo: MerkleDistributorInfo = parseBalanceMap(normalizedEarnings);
  //   console.log( "merkleInfo", merkleInfo);
  console.log(
    "merkleInfo",
    Object.keys(merkleInfo.claims).length + " total claims"
  );
  console.log("liq diff", t2 - t1);
  console.log("fee diff", t3 - t2);
  //   console.log("eoa diff", t4 - t3);

  const merkleRootFileName = `${baseFilePath}-${WEEK_NUMBER}-merkle-info.json`;
  try {
    fs.writeFileSync(merkleRootFileName, JSON.stringify(merkleInfo));
  } catch (error) {
    console.log("write merkle snapshot", error);
  }
})(args);
