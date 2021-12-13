import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { generateLpSnapshot } from "../src/lp-snapshot";
// import { writeSnapshot } from "../src/utils";
import { updateMagicCacheFromSnapshot } from "../src/magic";
import * as fs from "fs";
import { ONE_DAY_AGO, normalizeMapAmounts } from "../src/helpers";
import {
  parseBalanceMap,
  MerkleDistributorInfo,
} from "../../merkle-distributor/src/parse-balance-map";
import {
  combineMaps,
  createStringMap,
  addEoaToUserPayoutMap,
  TWO_DAYS_AGO,
} from "../src/helpers";
import { generateFeesSnapshot } from "../src/fees-snapshot";
import { ReturnType, MapOfCount } from "../src/interfaces";
import { writeSnapshot } from "../src/utils";

const DEFAULT_TOKEN_SUPPLY = 1000000;
const now = Date.now();
const DEFAULT_SNAPSHOT_FILE_PATH = `./snapshots/${now}-liq-mining`;
const DEFAULT_MERKLE_FILE_PATH = `./snapshots/${now}-merkle-root`;
// const DEFAULT_BLOCK_SAMPLE = 1800; //Approx every hour with a 2s block time
// const DEFAULT_BLOCK_SAMPLE = 1; // Every block
const DEFAULT_BLOCK_SAMPLE = 30; // Approx every min with a 2s block time
const DEFAULT_PER_BLOCK_TOKEN_SUPPLY = 60; // divide supply / sample to get per block amount

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
    default: TWO_DAYS_AGO,
    // default: EIGHT_DAYS_AGO,
  },
  feePerBlock: { type: "number", demandOption: false, default: 1 },
  snapshotFilePath: {
    type: "string",
    demandOption: false,
    default: DEFAULT_SNAPSHOT_FILE_PATH,
  },
  merkleRootFilePath: {
    type: "string",
    demandOption: false,
    default: DEFAULT_MERKLE_FILE_PATH,
  },
  incentivizedMarketMakerAddresses: {
    type: "array",
    demandOption: false,
    default: [
      "0x932b2aC1799D4353d802Ddc27eb6DBC952e24b36", // Will Ethereum reach $5000 by the end of ?"
      "0xBC12a7269EC807690793C86c81241eDCA8F2E3D0", // Will Coinbase’s NFT marketplace launch before 2022?
      "0x476238B6Ef1B0f065E97cffA22277cc2788852B7", // "will-there-be-nfl-scorigami-in-december-2021",
      "0x9E2d4470d3D599BB349d7457513dDD7379780dB0", // "will-the-omicron-variant-be-marked-as-a-variant-of-high-consequence-by-the-cdc-before-2022",
      "0x6474406F81b5C32D80eb1B3545b2B22a85B73AD3", // "will-uniswap-be-live-on-polygon-before-2022",
      "0x1e6C49e7E776E6F76d31E6D6FCb5dD367F7B59dD", // nfl-will-the-bills-beat-the-patriots-by-more-than-4pt5-points-in-their-d
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
  const endTimestamp = args.endTimestamp;
  const startTimestamp = args.startTimestamp;
  const supply = args.supply;
  const blockSampleSize = args.blockSampleSize;
  const perBlockReward = args.perBlockReward;
  const snapshotFilePath = args.snapshotFilePath;
  const merkleRootFilePath = args.merkleRootFilePath;

  const incentivizedMarketsMap = createStringMap(
    args.incentivizedMarketMakerAddresses.map(addr => addr.toLowerCase())
  );

  const liqMap = await generateLpSnapshot(
    ReturnType.Map,
    endTimestamp,
    supply,
    blockSampleSize,
    incentivizedMarketsMap,
    startTimestamp,
    perBlockReward
  );
  console.log("liqMap", liqMap);

  const feeMap = await generateFeesSnapshot(
    ReturnType.Map,
    startTimestamp,
    endTimestamp,
    supply
  );
  console.log("feeMap", feeMap);

  // todo - get previous claim snapshot
  const totalUserMap = combineMaps([
    liqMap as MapOfCount,
    feeMap as MapOfCount,
  ]);

  console.log("totalUserMap", totalUserMap);
  const normalizedUserMap = normalizeMapAmounts(totalUserMap);
  const merkleInfo: MerkleDistributorInfo = parseBalanceMap(normalizedUserMap);
  console.log("merkleInfo", merkleInfo);
  const merkleRootFileName = `${merkleRootFilePath}.json`;
  try {
    fs.writeFileSync(merkleRootFileName, JSON.stringify(merkleInfo));
  } catch (error) {
    console.log("write merkle snapshot", error);
  }

  // todo - what to do with null magic wallet addresses?
  // todo - we need to map this again to {[magic: string]: normalizedValue}?
  //   const normalizedMagicMap = snapshot.reduce((acc, curr) => {
  //     if (!acc[curr.magicWallet]) {
  //       // todo - what to do with null magic wallet addresses?
  //       acc[curr.magicWallet] = curr.amount;
  //     }
  //     return acc;
  //   }, {});

  // add EOA (magic)
  try {
    const snapshot = await addEoaToUserPayoutMap(normalizedUserMap);
    console.log("snapshot", snapshot);
    const snapshotFileName = `${snapshotFilePath}.json`;
    await writeSnapshot(snapshotFileName, snapshotFilePath, snapshot);
    updateMagicCacheFromSnapshot(snapshot);
  } catch (error) {
    console.log("write snapshot", error);
  }
})(args);
