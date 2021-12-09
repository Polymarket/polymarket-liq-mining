import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { generateLpSnapshot } from "../src/lp-snapshot";
// import { writeSnapshot } from "../src/utils";
import {
  parseBalanceMap,
  OldFormat,
  MerkleDistributorInfo,
} from "../../merkle-distributor/src/parse-balance-map";
import {
  combineMaps,
  createStringMap,
  addEoaToUserPayoutMap,
} from "../src/helpers";
import { generateFeesSnapshot } from "../src/fees-snapshot";
import { ReturnType, MapOfCount  } from "../src/interfaces";
import { writeSnapshot } from "../src/utils";

const DEFAULT_PER_BLOCK_TOKEN_SUPPLY = 2;
const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/liq-mining-";
const DEFAULT_BLOCK_SAMPLE = 1800; //Approx every hour with a 2s block time
// const DEFAULT_BLOCK_SAMPLE = 30; // Approx every min with a 2s block time
// const DEFAULT_BLOCK_SAMPLE = 1; // Every block

dotenv.config();

const args = yargs.options({
  endTimestamp: {
    type: "number",
    demandOption: false,
    // default: Date.now() - 86400000, // 1 day
    default: Date.now() - 172800000, // 2 day
  }, // 1 day,
  startTimestamp: {
    type: "number",
    demandOption: false,
    // default: Date.now() -  172800000, // 2 day
    default: Date.now() - 691200000, // 8 days
  },
  feePerBlock: { type: "number", demandOption: false, default: 1 },
  snapshotFilePath: {
    type: "string",
    demandOption: false,
    default: DEFAULT_SNAPSHOT_FILE_PATH,
  },
  incentivizedMarketMakerAddresses: {
    type: "array",
    demandOption: false,
    default: [
      "0x932b2aC1799D4353d802Ddc27eb6DBC952e24b36", // Will Ethereum reach $5000 by the end of ?"
      //   "0xBC12a7269EC807690793C86c81241eDCA8F2E3D0", // Will Coinbase’s NFT marketplace launch before 2022?
      "0x476238B6Ef1B0f065E97cffA22277cc2788852B7", // "will-there-be-nfl-scorigami-in-december-2021",
      //   "0x9E2d4470d3D599BB349d7457513dDD7379780dB0", // "will-the-omicron-variant-be-marked-as-a-variant-of-high-consequence-by-the-cdc-before-2022",
      "0x6474406F81b5C32D80eb1B3545b2B22a85B73AD3", // "will-uniswap-be-live-on-polygon-before-2022",
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
//   const snapshotFilePath = args.snapshotFilePath;

  const map = createStringMap(args.incentivizedMarketMakerAddresses);

  const liqMap = await generateLpSnapshot(
    ReturnType.Map,
    endTimestamp,
    supply,
    blockSampleSize,
    map,
    startTimestamp,
    perBlockReward
  );

  const feeMap = await generateFeesSnapshot(
    ReturnType.Map,
    startTimestamp,
    endTimestamp,
    supply
  );

  // todo - get previous claim snapshot
//   const prevMap 

  const totalUserMap = combineMaps([
    liqMap as MapOfCount,
    feeMap as MapOfCount,
    // prevMap as MapOfCount
  ]);
  console.log("totalUserMap", totalUserMap);

  // add EOA (magic)
//   const snapshot = await addEoaToUserPayoutMap(totalUserMap);
  // todo - what to do with null magic wallets?

  const merkleInfo: MerkleDistributorInfo = parseBalanceMap(totalUserMap);
  console.log('merkleInfo', merkleInfo)

//   const snapshotFileName = `${snapshotFilePath + Date.now().toString()}.json`;
//   await writeSnapshot(snapshotFileName, snapshotFilePath, snapshot);
})(args);
