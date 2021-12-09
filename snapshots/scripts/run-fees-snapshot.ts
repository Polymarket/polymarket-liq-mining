import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { generateFeesSnapshot } from "../src/fees-snapshot";
import { writeSnapshot } from "../src/utils";

const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/trader-fees-paid-";

dotenv.config();

const args = yargs.options({
  startTimestamp: {
    type: "number",
    demandOption: false,
    default: Date.now() - 691200000, // 8 days
  },
  endTimestamp: { type: "number", demandOption: false, default: Date.now() },
  snapshotFilePath: {
    type: "string",
    demandOption: false,
    default: DEFAULT_SNAPSHOT_FILE_PATH,
  },
  supply: { type: "number", demandOption: false, default: 1000000}
}).argv;

(async (args:any) => {
    const startTimestamp = args.startTimestamp;
    const endTimestamp = args.endTimestamp;
    const snapshotFilePath = args.snapshotFilePath;
    const supply = args.supply;

    const snapshot = await generateFeesSnapshot(startTimestamp, endTimestamp, supply);
	// console.log('snapshot', snapshot)
    // const snapshotFileName = `${snapshotFilePath + "-from-" + startTimestamp.toString() + "-to-" + endTimestamp.toString()}.json`;
    // await writeSnapshot(snapshotFileName, snapshotFilePath, snapshot);
})(args)