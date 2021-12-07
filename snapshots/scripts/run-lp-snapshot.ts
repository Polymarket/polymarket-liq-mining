import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { generateLpSnapshot } from "../src/lp-snapshot";
// import { writeSnapshot } from "../src/utils";
import { createStringMap } from '../src/create_string_map';

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/lp-weighted-";
const DEFAULT_BLOCK_SAMPLE = 1800; //Approx every hour with a 2s block time

dotenv.config();

const args = yargs.options({
  endTimestamp: { type: "number", demandOption: false, default: Date.now() - 86400000 }, // 1 day,
  startTimestamp: { type: "number", demandOption: false, default: (Date.now() - 691200000)}, // 8 days
  feePerBlock: {type: "number", demandOption: false, default: 1},
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
	"0xBC12a7269EC807690793C86c81241eDCA8F2E3D0", // Will Coinbase’s NFT marketplace launch before 2022? 
    ],
  },
  // do we need these?
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
}).argv;

(async (args: any) => {
  const endTimestamp = args.endTimestamp;
  const startTimestamp = args.startTimestamp;
  const supply = args.supply;
  const blockSampleSize = args.blockSampleSize;
//   const snapshotFilePath = args.snapshotFilePath;

 const map  = createStringMap(args.incentivizedMarketMakerAddresses)

 await generateLpSnapshot(
    endTimestamp,
    supply,
    blockSampleSize,
    map,
	startTimestamp,
  );
//   console.log("snapshot", snapshot);

  // const snapshotFileName = `${snapshotFilePath + timestamp.toString()}.json`;
  // await writeSnapshot(snapshotFileName, snapshotFilePath, snapshot);
})(args);