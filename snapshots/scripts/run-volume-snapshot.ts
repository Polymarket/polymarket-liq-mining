import * as dotenv from "dotenv";
import * as yargs from "yargs";
import { generateVolumeSnapshot , writeSnapshot  } from "../src";

const DEFAULT_TOKEN_SUPPLY = 1000000;
const DEFAULT_SNAPSHOT_FILE_PATH = "./snapshots/volume-weighted-";

dotenv.config();

const args = yargs.options({
    'timestamp': { type: 'number', demandOption: false, default: Date.now()},
    'supply': { type: 'string', demandOption: false, default: DEFAULT_TOKEN_SUPPLY},
    'snapshotFilePath': { type: 'string', demandOption: false, default: DEFAULT_SNAPSHOT_FILE_PATH}
  }).argv;

(async (args:any) => {
    const timestamp = args.timestamp;
    const supply = args.supply;
    const snapshotFilePath = args.snapshotFilePath;

    const snapshot = await generateVolumeSnapshot(timestamp, supply);

    await writeSnapshot(timestamp, snapshotFilePath, snapshot);
})(args)